import fs from "fs";
import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";

const slugify = (v) =>
    String(v || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || `post-${Date.now()}`;

const parseContent = (raw) => {
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
        const json = JSON.parse(raw);
        if (json && Array.isArray(json.blocks)) return json;
    } catch {
        // fallback plain text
    }
    return raw.trim();
};

const uniqueSlug = async (base, excludeId = null) => {
    let slug = base;
    let i = 0;
    while (true) {
        const q = { slug };
        if (excludeId) q._id = { $ne: excludeId };
        const exists = await blogModel.findOne(q).select("_id").lean();
        if (!exists) return slug;
        i += 1;
        slug = `${base}-${i}`;
    }
};

export const listPublished = async (_req, res) => {
    try {
        const data = await blogModel
            .find({ published: true })
            .sort({ createdAt: -1 })
            .select("title slug excerpt coverImage createdAt")
            .lean();
        return res.json({ success: true, data });
    } catch {
        return res.json({ success: false, message: "Error" });
    }
};

export const getBySlugOrId = async (req, res) => {
    try {
        const { slugOrId } = req.params;
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(slugOrId)) {
            doc = await blogModel.findById(slugOrId).lean();
        }
        if (!doc) doc = await blogModel.findOne({ slug: slugOrId }).lean();
        if (!doc || !doc.published) return res.json({ success: false, message: "Not found" });
        return res.json({ success: true, data: doc });
    } catch {
        return res.json({ success: false, message: "Error" });
    }
};

export const listAll = async (_req, res) => {
    try {
        const data = await blogModel.find({}).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data });
    } catch {
        return res.json({ success: false, message: "Error" });
    }
};

export const getByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.json({ success: false, message: "Invalid id" });
        const data = await blogModel.findById(id).lean();
        if (!data) return res.json({ success: false, message: "Not found" });
        return res.json({ success: true, data });
    } catch {
        return res.json({ success: false, message: "Error" });
    }
};

export const addBlog = async (req, res) => {
    try {
        const title = String(req.body.title || "").trim();
        const excerpt = String(req.body.excerpt || "").trim();
        const content = parseContent(req.body.content);
        const slugBase = slugify(req.body.slug || title);
        const published = req.body.published === "true" || req.body.published === true;
        if (!title || !excerpt || !content) return res.json({ success: false, message: "Missing fields" });
        if (!req.file?.filename) return res.json({ success: false, message: "Cover image is required" });
        const slug = await uniqueSlug(slugBase);
        const data = await blogModel.create({
            title,
            slug,
            excerpt,
            content,
            coverImage: req.file.filename,
            published
        });
        return res.json({ success: true, message: "Blog post created", data });
    } catch {
        return res.json({ success: false, message: "Error" });
    }
};

export const updateBlog = async (req, res) => {
    try {
        const id = req.body.id;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.json({ success: false, message: "Invalid id" });
        const doc = await blogModel.findById(id);
        if (!doc) return res.json({ success: false, message: "Not found" });

        if (req.body.title) doc.title = String(req.body.title).trim();
        if (req.body.excerpt !== undefined) doc.excerpt = String(req.body.excerpt).trim();
        if (req.body.content !== undefined) {
            const parsed = parseContent(req.body.content);
            if (parsed) doc.content = parsed;
        }
        if (req.body.slug) doc.slug = await uniqueSlug(slugify(req.body.slug), doc._id);
        if (req.body.published !== undefined) doc.published = req.body.published === "true" || req.body.published === true;
        if (req.file?.filename) {
            const old = doc.coverImage;
            doc.coverImage = req.file.filename;
            if (old) fs.unlink(`uploads/${old}`, () => {});
        }
        await doc.save();
        return res.json({ success: true, message: "Blog post updated", data: doc });
    } catch {
        return res.json({ success: false, message: "Error" });
    }
};

export const removeBlog = async (req, res) => {
    try {
        const { id } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.json({ success: false, message: "Invalid id" });
        const doc = await blogModel.findById(id);
        if (!doc) return res.json({ success: false, message: "Not found" });
        if (doc.coverImage) fs.unlink(`uploads/${doc.coverImage}`, () => {});
        await blogModel.findByIdAndDelete(id);
        return res.json({ success: true, message: "Blog post removed" });
    } catch {
        return res.json({ success: false, message: "Error" });
    }
};

export const uploadImage = async (req, res) => {
    if (!req.file?.filename) return res.status(400).json({ success: 0, message: "Image required" });
    return res.json({
        success: 1,
        file: { url: `${req.protocol}://${req.get("host")}/images/${req.file.filename}` }
    });
};
