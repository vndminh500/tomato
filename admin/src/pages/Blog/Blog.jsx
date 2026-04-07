import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./Blog.css";

const Blog = ({ url, token, basePath = "", canCreate = false, canUpdate = false, canDelete = false }) => {
  const [posts, setPosts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const menuRef = useRef(null);

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

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!openMenuPostId) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuPostId(null);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openMenuPostId]);

  const removePost = async () => {
    if (!deleteTarget?._id) return;
    try {
      const res = await axios.post(`${url}/api/blog/remove`, { id: deleteTarget._id }, { headers: { token } });
      if (res.data?.success) {
        setPosts((prev) => prev.filter((x) => x._id !== deleteTarget._id));
        toast.success("Post deleted successfully");
        setDeleteTarget(null);
      } else {
        toast.error(res.data?.message || "Delete failed");
      }
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
          <div key={p._id} className={`row${openMenuPostId === p._id ? " row--menu-open" : ""}`}>
            <img src={`${url}/images/${p.coverImage}`} alt="" />
            <div className="meta">
              <p className="title">{p.title}</p>
              <p className="sub">{p.slug}</p>
            </div>
            {canUpdate || canDelete ? (
              <div className="blog-actions-cell" ref={openMenuPostId === p._id ? menuRef : undefined}>
                <button
                  type="button"
                  className={`blog-menu-trigger${openMenuPostId === p._id ? " is-open" : ""}`}
                  aria-label="Open actions menu"
                  aria-expanded={openMenuPostId === p._id}
                  onClick={() => setOpenMenuPostId((id) => (id === p._id ? null : p._id))}
                >
                  <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                </button>
                {openMenuPostId === p._id ? (
                  <ul className="blog-action-menu" role="menu">
                    {canUpdate ? (
                      <li role="none">
                        <Link
                          to={`${basePath}/blog/edit/${p._id}`}
                          role="menuitem"
                          className="blog-action-menu-item"
                          onClick={() => setOpenMenuPostId(null)}
                        >
                          Edit
                        </Link>
                      </li>
                    ) : null}
                    {canDelete ? (
                      <li role="none">
                        <button
                          type="button"
                          role="menuitem"
                          className="blog-action-menu-item blog-action-menu-item--danger"
                          onClick={() => {
                            setOpenMenuPostId(null);
                            setDeleteTarget({ _id: p._id, title: p.title });
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {deleteTarget ? (
        <div className="delete-modal-overlay" role="dialog" aria-modal="true">
          <div className="delete-modal">
            <h4>Confirm deletion</h4>
            <p>
              Delete post <strong>{deleteTarget.title}</strong>?
            </p>
            <div className="delete-modal-actions">
              <button type="button" className="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={removePost}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Blog;
