import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        excerpt: { type: String, required: true, trim: true },
        content: { type: mongoose.Schema.Types.Mixed, required: true },
        coverImage: { type: String, required: true },
        published: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const blogModel = mongoose.models.blog || mongoose.model("blog", blogSchema);
export default blogModel;
