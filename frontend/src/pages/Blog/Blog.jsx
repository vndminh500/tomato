import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./Blog.css";

const Blog = () => {
  const { url } = useContext(StoreContext);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${url}/api/blog/list`);
        if (res.data?.success) setPosts(res.data.data || []);
      } catch {
        setPosts([]);
      }
    };
    run();
  }, [url]);

  return (
    <div className="blog-page">
      <h1>Blog</h1>
      <p className="blog-sub">News, tips and stories from Potato.</p>
      <div className="blog-grid">
        {posts.map((p) => (
          <Link key={p._id} to={`/blog/${p.slug}`} className="blog-card">
            <img src={`${url}/images/${p.coverImage}`} alt="" />
            <div className="blog-card-body">
              <h3>{p.title}</h3>
              <p>{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Blog;
