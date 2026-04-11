import React, { useEffect, useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets';
import axios from "axios"
import { toast } from 'react-toastify';
import { safeImageFileName } from '../../utils/safeUploadName.js'

const ADD_TOAST_ID = 'admin-add-food'

const Add = ({url, token}) => {

    const[image,setImage] = useState(false);
    const [submitting, setSubmitting] = useState(false)
    const [data,setData] = useState({
        name:"",
        description:"",
        price:"",
        category:"Salad",
        stock:"20"
    })

    /** Wake Render (etc.) free-tier API early so the real upload is less likely to wait on cold start. */
    useEffect(() => {
        const base = String(url || '').replace(/\/$/, '')
        if (!base) return
        axios.get(`${base}/`, { timeout: 30_000 }).catch(() => {})
    }, [url])

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (!image) {
            toast.error('Please choose an image.')
            return
        }
        if (submitting) return

        const formData = new FormData();
        formData.append("name",data.name)
        formData.append("description",data.description)
        formData.append("price",Number(data.price))
        formData.append("category",data.category)
        formData.append("stock", data.stock ?? "20")
        formData.append("image", image, safeImageFileName(image))
        
        setSubmitting(true)
        toast.loading(
            'Sending… On free hosting the API may be asleep — first request can take ~1 min.',
            { toastId: ADD_TOAST_ID, autoClose: false }
        )
        try {
            const response = await axios.post(`${url}/api/food/add`, formData, {
                headers: { token },
                timeout: 120_000,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });
            toast.dismiss(ADD_TOAST_ID)
            if (response.data.success) {
                setData ({
                    name:"",
                    description:"",
                    price:"",
                    category:"Salad",
                    stock:"20"
                }) 
                setImage(false)
                toast.success(response.data.message)
            }
            else {
                toast.error(response.data.message)
            }
        } catch (err) {
            toast.dismiss(ADD_TOAST_ID)
            let msg =
                err.response?.data?.message ||
                err.message ||
                "Request failed. Check network or backend URL (VITE_BACKEND_URL)."
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                msg = 'Server took too long (timeout). On Render free tier the first request after idle can take 1–2 minutes — try again.'
            }
            if (!err.response && err.message === 'Network Error') {
                msg =
                    'Network error (no response). Often: wrong API URL, CORS, or too many pending requests. Try a smaller image / JPG, wait for other requests to finish, or reload.'
            }
            toast.error(msg)
        } finally {
            setSubmitting(false)
        }
    }

  return (
    <div className='add'>
      <div className='add-header'>
        <p className='add-badge'>Catalog</p>
        <h2>Add New Item</h2>
        <span>Create a complete product card before publishing.</span>
        <p className="add-hosting-hint">
          Free plans often <strong>sleep</strong> the server after idle time. The first save after that can take
          about a minute while it wakes up — not a bug. Paid instances or a scheduled ping stay warm.
        </p>
      </div>
      <form className='flex-col' onSubmit={onSubmitHandler}>
        <div className='add-form-main'>
          <div className='add-img-upload-col'>
              <p>Upload Image</p>
              <label htmlFor="image" className='add-image-box'>
                  <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="Upload preview"/>
                  <span>Click to upload</span>
              </label>
              <input
                onChange={(e)=>setImage(e.target.files[0])}
                type="file"
                name=""
                id="image"
                hidden
                required
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              />
          </div>

          <div className="add-product-name flex-col">
              <p>Product name</p>
              <input onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Type here'/>
          </div>

          <div className="add-product-description flex-col">
              <p>Product description</p>
              <textarea onChange={onChangeHandler} value={data.description} name="description" rows="6" placeholder='Write here' required></textarea>
          </div>

          <div className="add-category-price">
              <div className="add-category flex-col">
                  <p>Category</p>
                  <select onChange={onChangeHandler} name="category" value={data.category}>
                      <option value="Salad">Salad</option>
                      <option value="Rolls">Rolls</option>
                      <option value="Deserts">Deserts</option>
                      <option value="Sandwich">Sandwich</option>
                      <option value="Cake">Cake</option>
                      <option value="Pure Veg">Pure Veg</option>
                      <option value="Pasta">Pasta</option>
                      <option value="Noodles">Noodles</option>
                  </select>
              </div>
              <div className="add-price flex-col">
                  <p>Price</p>
                  <input onChange={onChangeHandler} value={data.price} type="Number" name='price' placeholder='...' />
              </div>
              <div className="add-quantity flex-col">
                  <p>Quantity</p>
                  <input
                    onChange={onChangeHandler}
                    value={data.stock}
                    type="number"
                    name="stock"
                    min="0"
                    placeholder="0"
                  />
              </div>
          </div>
          <button type='submit' className='add-btn' disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Item'}
          </button>
        </div>

        <aside className='add-preview'>
            <p className='add-preview-title'>Live Preview</p>
            <div className='add-preview-card'>
                <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="Food preview card" />
                <div>
                    <h4>{data.name || "Product name"}</h4>
                    <p>{data.description || "Your description will appear here for customers."}</p>
                </div>
                <div className='add-preview-meta'>
                    <div className='add-preview-tags'>
                        <span>{data.category}</span>
                        <span className='add-preview-qty'>Qty {data.stock || '0'}</span>
                    </div>
                    <b>{data.price} VND</b>
                </div>
            </div>
            <div className='add-preview-tips'>
                <p>Quick Tips</p>
                <ul>
                    <li>Use clear image and short product name.</li>
                    <li>Write 1-2 benefit-focused description lines.</li>
                    <li>Set price in number format without symbols.</li>
                </ul>
            </div>
        </aside>
      </form>
    </div>
  )
}

export default Add
