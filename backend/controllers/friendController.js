const User = require("../models/User");

// Search users by username or name
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ message: "Search query must be at least 2 characters" });
        }

        const searchQuery = q.trim().toLowerCase();
        const currentUserId = req.user._id;

        // Search by username or name
        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Exclude current user
                {
                    $or: [
                        { username: { $regex: searchQuery, $options: "i" } },
                        { name: { $regex: searchQuery, $options: "i" } },
                    ],
                },
            ],
        })
            .select("name username profileImage bio")
            .limit(20);

        // Add relationship status for each user
        const currentUser = await User.findById(currentUserId);
        const usersWithStatus = users.map(user => {
            let status = "stranger";
            if (currentUser.isFriendsWith(user._id)) {
                status = "friends";
            } else if (currentUser.hasSentRequestTo(user._id)) {
                status = "request_sent";
            } else if (currentUser.hasReceivedRequestFrom(user._id)) {
                status = "request_received";
            }

            return {
                _id: user._id,
                name: user.name,
                username: user.username,
                profileImage: user.profileImage,
                bio: user.bio,
                status,
            };
        });

        res.json(usersWithStatus);
    } catch (err) {
        console.error("Search users error:", err);
        res.status(500).json({ message: "Failed to search users" });
    }
};

// Get user's public profile (supports both username and ID)
exports.getUserProfile = async (req, res) => {
    try {
        const { identifier } = req.params;
        const currentUserId = req.user?._id;

        // Try to find by username first, then by ID
        let user = await User.findOne({ username: identifier })
            .select("-password -__v")
            .populate("friends", "name username profileImage");

        // If not found by username, try finding by ID
        if (!user && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            user = await User.findById(identifier)
                .select("-password -__v")
                .populate("friends", "name username profileImage");
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Determine relationship status
        let status = "stranger";
        let isSelf = false;

        if (currentUserId) {
            if (user._id.toString() === currentUserId.toString()) {
                isSelf = true;
                status = "self";
            } else {
                const currentUser = await User.findById(currentUserId);
                console.log("Checking friendship:");
                console.log("  Current user ID:", currentUserId.toString());
                console.log("  Target user ID:", user._id.toString());
                console.log("  Current user friends:", currentUser.friends.map(f => f.toString()));

                if (currentUser.isFriendsWith(user._id)) {
                    status = "friends";
                    console.log("  Status: FRIENDS");
                } else if (currentUser.hasSentRequestTo(user._id)) {
                    status = "request_sent";
                    console.log("  Status: REQUEST_SENT");
                } else if (currentUser.hasReceivedRequestFrom(user._id)) {
                    status = "request_received";
                    console.log("  Status: REQUEST_RECEIVED");
                } else {
                    console.log("  Status: STRANGER");
                }
            }
        }

        // Build response based on relationship
        const publicInfo = {
            _id: user._id,
            name: user.name,
            username: user.username,
            profileImage: user.profileImage,
            bio: user.bio,
            isPublic: user.isPublic,
            status,
            friendsCount: user.friends.length,
            createdAt: user.createdAt,
        };

        // If friends, self, or public profile - show full details
        if (status === "friends" || isSelf || user.isPublic) {
            publicInfo.friends = user.friends;
        }

        res.json(publicInfo);
    } catch (err) {
        console.error("Get user profile error:", err);
        res.status(500).json({ message: "Failed to get user profile" });
    }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself" });
        }

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId),
        ]);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (currentUser.isFriendsWith(userId)) {
            return res.status(400).json({ message: "You are already friends with this user" });
        }

        // Check if request already sent
        if (currentUser.hasSentRequestTo(userId)) {
            return res.status(400).json({ message: "Friend request already sent" });
        }

        // Check if they already sent you a request (auto-accept)
        if (currentUser.hasReceivedRequestFrom(userId)) {
            // Auto-accept: make them friends
            currentUser.friends.push(userId);
            targetUser.friends.push(currentUserId);
            currentUser.receivedRequests = currentUser.receivedRequests.filter(
                id => id.toString() !== userId
            );
            targetUser.sentRequests = targetUser.sentRequests.filter(
                id => id.toString() !== currentUserId.toString()
            );

            await Promise.all([currentUser.save(), targetUser.save()]);

            return res.json({ message: "You are now friends!", status: "friends" });
        }

        // Send the request
        currentUser.sentRequests.push(userId);
        targetUser.receivedRequests.push(currentUserId);

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.json({ message: "Friend request sent", status: "request_sent" });
    } catch (err) {
        console.error("Send friend request error:", err);
        res.status(500).json({ message: "Failed to send friend request" });
    }
};

// Cancel sent friend request
exports.cancelFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId),
        ]);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove from sent requests
        currentUser.sentRequests = currentUser.sentRequests.filter(
            id => id.toString() !== userId
        );
        targetUser.receivedRequests = targetUser.receivedRequests.filter(
            id => id.toString() !== currentUserId.toString()
        );

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.json({ message: "Friend request cancelled", status: "stranger" });
    } catch (err) {
        console.error("Cancel friend request error:", err);
        res.status(500).json({ message: "Failed to cancel friend request" });
    }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const [currentUser, requester] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId),
        ]);

        if (!requester) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if request exists
        if (!currentUser.hasReceivedRequestFrom(userId)) {
            return res.status(400).json({ message: "No friend request from this user" });
        }

        // Add to friends
        currentUser.friends.push(userId);
        requester.friends.push(currentUserId);

        // Remove from requests
        currentUser.receivedRequests = currentUser.receivedRequests.filter(
            id => id.toString() !== userId
        );
        requester.sentRequests = requester.sentRequests.filter(
            id => id.toString() !== currentUserId.toString()
        );

        await Promise.all([currentUser.save(), requester.save()]);

        res.json({ message: "Friend request accepted", status: "friends" });
    } catch (err) {
        console.error("Accept friend request error:", err);
        res.status(500).json({ message: "Failed to accept friend request" });
    }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const [currentUser, requester] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId),
        ]);

        if (!requester) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove from requests
        currentUser.receivedRequests = currentUser.receivedRequests.filter(
            id => id.toString() !== userId
        );
        requester.sentRequests = requester.sentRequests.filter(
            id => id.toString() !== currentUserId.toString()
        );

        await Promise.all([currentUser.save(), requester.save()]);

        res.json({ message: "Friend request rejected", status: "stranger" });
    } catch (err) {
        console.error("Reject friend request error:", err);
        res.status(500).json({ message: "Failed to reject friend request" });
    }
};

// Remove friend
exports.removeFriend = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const [currentUser, friend] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId),
        ]);

        if (!friend) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove from both friends lists
        currentUser.friends = currentUser.friends.filter(
            id => id.toString() !== userId
        );
        friend.friends = friend.friends.filter(
            id => id.toString() !== currentUserId.toString()
        );

        await Promise.all([currentUser.save(), friend.save()]);

        res.json({ message: "Friend removed", status: "stranger" });
    } catch (err) {
        console.error("Remove friend error:", err);
        res.status(500).json({ message: "Failed to remove friend" });
    }
};

// Get all friend requests (sent and received)
exports.getFriendRequests = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id)
            .populate("sentRequests", "name username profileImage")
            .populate("receivedRequests", "name username profileImage");

        res.json({
            sent: currentUser.sentRequests,
            received: currentUser.receivedRequests,
        });
    } catch (err) {
        console.error("Get friend requests error:", err);
        res.status(500).json({ message: "Failed to get friend requests" });
    }
};

// Get friends list
exports.getFriendsList = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id)
            .populate("friends", "name username profileImage bio");

        res.json(currentUser.friends);
    } catch (err) {
        console.error("Get friends list error:", err);
        res.status(500).json({ message: "Failed to get friends list" });
    }
};

// Get relationship status with a user
exports.getRelationshipStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.json({ status: "self" });
        }

        const currentUser = await User.findById(currentUserId);

        let status = "stranger";
        if (currentUser.isFriendsWith(userId)) {
            status = "friends";
        } else if (currentUser.hasSentRequestTo(userId)) {
            status = "request_sent";
        } else if (currentUser.hasReceivedRequestFrom(userId)) {
            status = "request_received";
        }

        res.json({ status });
    } catch (err) {
        console.error("Get relationship status error:", err);
        res.status(500).json({ message: "Failed to get relationship status" });
    }
};

// Update username
exports.updateUsername = async (req, res) => {
    try {
        const { username } = req.body;
        const currentUserId = req.user._id;

        if (!username || username.trim().length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
        }

        const cleanUsername = username.trim().toLowerCase();

        // Check if username is taken
        const existingUser = await User.findOne({
            username: cleanUsername,
            _id: { $ne: currentUserId }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Username is already taken" });
        }

        const user = await User.findByIdAndUpdate(
            currentUserId,
            { username: cleanUsername },
            { new: true, runValidators: true }
        ).select("-password");

        res.json(user);
    } catch (err) {
        console.error("Update username error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Username is already taken" });
        }
        res.status(500).json({ message: "Failed to update username" });
    }
};
