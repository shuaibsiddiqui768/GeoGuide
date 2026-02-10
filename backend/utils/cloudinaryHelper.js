const cloudinary = require("../config/cloudinary");

/**
 * Extracts the public_id from a Cloudinary URL
 * @param {string} url - The Cloudinary image URL
 * @returns {string|null} - The public_id or null if not valid
 */
const getPublicIdFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;

    try {
        // Cloudinary URLs usually follow: .../upload/[transformations]/[version]/[public_id].[ext]
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return null;

        // Take everything after 'upload'
        const afterUpload = parts.slice(uploadIndex + 1);

        // Filter out segments that are clearly NOT the public_id
        // 1. Transformations: segments containing commas (e.g. w_200,c_fill)
        // 2. Version: segments starting with 'v' followed by digits (e.g. v12345678)
        const publicIdSegments = afterUpload.filter(segment => {
            if (segment.match(/^v\d+$/)) return false; // Skip version
            if (segment.includes(",")) return false;    // Skip complex transformations
            // Skip simple transformations like w_300 or h_200
            if (segment.match(/^[a-z]_[a-z0-9]+$/)) return false;
            return true;
        });

        // The last part contains the filename + extension
        const fullIdWithExt = publicIdSegments.join("/");

        // Remove file extension
        return fullIdWithExt.split(".").slice(0, -1).join(".");
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
        .map(publicId => {
            console.log(`Deleting from Cloudinary: ${publicId}`);
            return cloudinary.uploader.destroy(publicId);
        });

    try {
        const results = await Promise.all(deletePromises);
        return results;
    } catch (err) {
        console.error("Cloudinary batch delete error:", err);
        throw err;
    }
};

module.exports = {
    getPublicIdFromUrl,
    deleteImagesFromCloudinary
};
