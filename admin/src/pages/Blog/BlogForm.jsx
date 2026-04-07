import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Embed from "@editorjs/embed";
import ImageTool from "@editorjs/image";
import "./BlogForm.css";

const BlogForm = ({ url, token, basePath = "" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const editorRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [existingCover, setExistingCover] = useState("");
  const [data, setData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    published: true
  });
  const [initialContent, setInitialContent] = useState({ time: Date.now(), blocks: [{ type: "paragraph", data: { text: "" } }] });

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        const res = await axios.get(`${url}/api/blog/admin/post/${id}`, { headers: { token } });
        if (res.data?.success) {
          const p = res.data.data;
          setExistingCover(p.coverImage || "");
          setData({
            title: p.title || "",
            slug: p.slug || "",
            excerpt: p.excerpt || "",
            published: p.published !== false
          });
          setInitialContent(
            p.content && typeof p.content === "object" && Array.isArray(p.content.blocks)
              ? p.content
              : { time: Date.now(), blocks: [{ type: "paragraph", data: { text: String(p.content || "") } }] }
          );
        }
      } catch {
        toast.error("Unable to load post");
      }
    };
    load();
  }, [id, isEdit, token, url]);

  useEffect(() => {
    if (editorRef.current) return;
    const editor = new EditorJS({
      holder: "editor-blog",
      data: initialContent,
      tools: {
        header: Header,
        list: List,
        quote: Quote,
        embed: Embed,
        image: {
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile: async (file) => {
                const fd = new FormData();
                fd.append("image", file);
                const res = await axios.post(`${url}/api/blog/upload-image`, fd, { headers: { token } });
                return res.data;
              }
            }
          }
        }
      },
      onReady: () => setReady(true)
    });
    editorRef.current = editor;
    return () => {
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, [initialContent, token, url]);

  const submit = async (e) => {
    e.preventDefault();
    if (!data.title.trim() || !data.excerpt.trim()) return toast.error("Please fill title and excerpt");
    if (!isEdit && !coverFile) return toast.error("Please choose cover image");
    try {
      const content = await editorRef.current.save();
      const fd = new FormData();
      if (isEdit) fd.append("id", id);
      fd.append("title", data.title.trim());
      fd.append("slug", data.slug.trim());
      fd.append("excerpt", data.excerpt.trim());
      fd.append("content", JSON.stringify(content));
      fd.append("published", data.published ? "true" : "false");
      if (coverFile) fd.append("cover", coverFile);
      const endpoint = isEdit ? `${url}/api/blog/update` : `${url}/api/blog/add`;
      const res = await axios.post(endpoint, fd, { headers: { token } });
      if (res.data?.success) {
        toast.success(isEdit ? "Post updated successfully" : "Post created successfully");
        navigate(`${basePath}/blog`);
      }
      else toast.error(res.data?.message || "Save failed");
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <div className="blog-form-page">
      <h3>{isEdit ? "Edit Blog" : "New Blog"}</h3>
      <form className="blog-form" onSubmit={submit}>
        <input placeholder="Title" value={data.title} onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))} />
        <input placeholder="Slug (optional)" value={data.slug} onChange={(e) => setData((p) => ({ ...p, slug: e.target.value }))} />
        <textarea rows={3} placeholder="Short description" value={data.excerpt} onChange={(e) => setData((p) => ({ ...p, excerpt: e.target.value }))} />
        <div id="editor-blog" className="editor-shell" />
        <label className="cover-uploader">
          <img src={coverFile ? URL.createObjectURL(coverFile) : existingCover ? `${url}/images/${existingCover}` : assets.upload_area} alt="" />
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          <span>Choose cover image</span>
        </label>
        <label className="publish-check">
          <input type="checkbox" checked={data.published} onChange={(e) => setData((p) => ({ ...p, published: e.target.checked }))} />
          Published
        </label>
        <button type="submit" disabled={!ready}>{isEdit ? "Save changes" : "Publish"}</button>
      </form>
    </div>
  );
};

export default BlogForm;
