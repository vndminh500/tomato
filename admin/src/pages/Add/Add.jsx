import React, { useState} from 'react'
import './Add.css'
import { assets } from '../../assets/assets';
import axios from "axios"
import { toast } from 'react-toastify';

const Add = ({url, token}) => {

    const[image,setImage] = useState(false);
    const [data,setData] = useState({
        name:"",
        description:"",
        price:"",
        category:"Salad"
    })

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append("name",data.name)
        formData.append("description",data.description)
        formData.append("price",Number(data.price))
        formData.append("category",data.category)
        formData.append("image",image)
        
        const response = await axios.post(`${url}/api/food/add`,formData,{
            headers:{token}
        });
        if (response.data.success) {
            setData ({
                name:"",
                description:"",
                price:"",
                category:"Salad"
            }) 
            setImage(false)
            toast.success(response.data.message)
        }
        else {
            toast.error(response.data.message)
        }
    }

  return (
    <div className='add'>
      <div className='add-header'>
        <p className='add-badge'>Catalog</p>
        <h2>Add New Item</h2>
        <span>Create a complete product card before publishing.</span>
      </div>
      <form className='flex-col' onSubmit={onSubmitHandler}>
        <div className='add-form-main'>
          <div className='add-img-upload-col'>
              <p>Upload Image</p>
              <label htmlFor="image" className='add-image-box'>
                  <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="Upload preview"/>
                  <span>Click to upload</span>
              </label>
              <input onChange={(e)=>setImage(e.target.files[0])} type="file" name="" id="image" hidden required />
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
          </div>
          <button type='submit' className='add-btn'>Add Item</button>
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
                    <span>{data.category}</span>
                    <b>${data.price || "0.00"}</b>
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
