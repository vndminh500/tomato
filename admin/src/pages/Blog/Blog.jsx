import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./Blog.css";

const Blog = ({ url, token, basePath = "", canCreate = false, canUpdate = false, canDelete = false }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${url}/api/blog/admin/all`, { headers: { token } });
        if (res.data?.success) setPosts(res.data.data || []);
      } catch {
        toast.error("Unable to load posts");
      }
    };
    run();
  }, [url, token]);

  const removePost = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await axios.post(`${url}/api/blog/remove`, { id }, { headers: { token } });
      if (res.data?.success) setPosts((prev) => prev.filter((x) => x._id !== id));
      else toast.error(res.data?.message || "Delete failed");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="admin-blog">
      <div className="head">
        <h3>Blog</h3>
        {canCreate ? <Link to={`${basePath}/blog/add`} className="new-btn">New Post</Link> : null}
      </div>
      <div className="rows">
        {posts.map((p) => (
          <div key={p._id} className="row">
            <img src={`${url}/images/${p.coverImage}`} alt="" />
            <div className="meta">
              <p className="title">{p.title}</p>
              <p className="sub">{p.slug}</p>
            </div>
            <div className="actions">
              {canUpdate ? <Link to={`${basePath}/blog/edit/${p._id}`}>Edit</Link> : null}
              {canDelete ? <button type="button" onClick={() => removePost(p._id)}>Delete</button> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;
