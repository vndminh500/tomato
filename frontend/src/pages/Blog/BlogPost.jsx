import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./BlogPost.css";
import NotFound from "../NotFound/NotFound";

const txt = (v) => String(v || "").replace(/<[^>]+>/g, "");

const BlogPost = () => {
  const { slugOrId } = useParams();
  const { url } = useContext(StoreContext);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${url}/api/blog/${encodeURIComponent(slugOrId)}`);
        if (res.data?.success) setPost(res.data.data);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [slugOrId, url]);

  useEffect(() => {
    const run = async () => {
      if (!post?._id && !post?.slug) return;
      try {
        const res = await axios.get(`${url}/api/blog/list`);
        const all = Array.isArray(res.data?.data) ? res.data.data : [];
        const currentId = String(post._id || "");
        const currentSlug = String(post.slug || "");
        const tokens = new Set(
          `${post.title || ""} ${post.excerpt || ""}`
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((x) => x.length > 2)
        );

        const scored = all
          .filter((x) => String(x._id) !== currentId && String(x.slug) !== currentSlug)
          .map((x) => {
            const cand = `${x.title || ""} ${x.excerpt || ""}`.toLowerCase();
            let score = 0;
            tokens.forEach((t) => {
              if (cand.includes(t)) score += 1;
            });
            return { ...x, _score: score };
          })
          .sort((a, b) => (b._score - a._score) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
          .slice(0, 3);

        setRelatedPosts(scored);
      } catch {
        setRelatedPosts([]);
      }
    };
    run();
  }, [post, url]);

  if (loading) return null;
  if (!post) return <NotFound />;

  const doc = post.content && typeof post.content === "object" && Array.isArray(post.content.blocks) ? post.content : null;

  return (
    <article className="blog-post">
      <Link to="/blog" className="back-link">← Back to blog</Link>
      <h1>{post.title}</h1>
      <img className="cover" src={`${url}/images/${post.coverImage}`} alt="" />
      <div className="content">
        {doc ? doc.blocks.map((b, i) => {
          if (b.type === "paragraph") return <p key={i}>{txt(b.data?.text)}</p>;
          if (b.type === "header") return <h2 key={i}>{txt(b.data?.text)}</h2>;
          if (b.type === "list") {
            const items = Array.isArray(b.data?.items) ? b.data.items : [];
            return b.data?.style === "ordered"
              ? <ol key={i}>{items.map((it, idx) => <li key={idx}>{txt(it?.content || it)}</li>)}</ol>
              : <ul key={i}>{items.map((it, idx) => <li key={idx}>{txt(it?.content || it)}</li>)}</ul>;
          }
          if (b.type === "quote") return <blockquote key={i}>{txt(b.data?.text)}</blockquote>;
          if (b.type === "image") {
            const src = b.data?.file?.url || b.data?.url;
            return src ? <img key={i} className="inline-media" src={src} alt="" /> : null;
          }
          if (b.type === "embed") {
            const src = b.data?.embed;
            return src ? <div key={i} className="embed"><iframe src={src} title={`embed-${i}`} allowFullScreen /></div> : null;
          }
          return null;
        }) : <p>{String(post.content || "")}</p>}
      </div>

      {relatedPosts.length > 0 ? (
        <section className="related-posts">
          <h3>Related Posts</h3>
          <div className="related-grid">
            {relatedPosts.map((item) => (
              <Link key={item._id} to={`/blog/${item.slug}`} className="related-card">
                <img src={`${url}/images/${item.coverImage}`} alt="" />
                <div className="related-card-body">
                  <h4>{item.title}</h4>
                  <p>{item.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
};

export default BlogPost;
