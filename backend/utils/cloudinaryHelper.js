const cloudinary = require("../config/cloudinary");

/**
 * Extracts the public_id from a Cloudinary URL
 * @param {string} url - The Cloudinary image URL
 * @returns {string|null} - The public_id or null if not valid
 */
const getPublicIdFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;

    try {
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return null;

        const afterUpload = parts.slice(uploadIndex + 1);

        // Filter segments:
        // 1. Skip version (v12345678)
        // 2. Skip transformations (contains commas or matches specific patterns like w_300)
        const publicIdSegments = afterUpload.filter(segment => {
            if (segment.match(/^v\d+$/)) return false;
            if (segment.includes(",")) return false;
            if (segment.match(/^[a-z]_[a-z0-9%]+$/)) return false; // Added support for common transform chars
            return true;
        });

        const fullIdWithExt = publicIdSegments.join("/");

        // Remove file extension (e.g., .jpg, .png, .webp)
        // Cloudinary handles public IDs without extensions in destruction calls
        const publicId = fullIdWithExt.split(".").slice(0, -1).join(".");
        return publicId;
    } catch (err) {
        console.error("Error parsing Cloudinary URL:", err);
        return null;
    }
};

/**
 * Deletes images from Cloudinary given their URLs
 * @param {string|string[]} urls - Single URL or array of URLs
 */
const deleteImagesFromCloudinary = async (urls) => {
    if (!urls) return;
    const urlArray = Array.isArray(urls) ? urls : [urls];

    const deletePromises = urlArray
        .map(url => getPublicIdFromUrl(url))
        .filter(publicId => publicId !== null)
        .map(async (publicId) => {
            try {
                console.log(`Attempting Cloudinary destruction for: ${publicId}`);
                const result = await cloudinary.uploader.destroy(publicId);
                console.log(`Cloudinary destruction result for ${publicId}:`, result);
                return result;
            } catch (err) {
                console.error(`Error destroying Cloudinary asset ${publicId}:`, err);
                return { result: "error", error: err.message };
            }
        });

    return await Promise.all(deletePromises);
};

module.exports = {
    getPublicIdFromUrl,
    deleteImagesFromCloudinary
};
