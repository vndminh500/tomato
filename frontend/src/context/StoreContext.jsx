import axios from "axios";
import { createContext , useEffect, useState } from "react";


export const StoreContext = createContext(null)

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});

    const url = "http://localhost:4000"

    const [token,setToken] = useState("")
    const [food_list,setFoodList] = useState([])
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [message, setMessage] = useState('');


    const applyPromoCode = async (code) => {
        try {
            const response = await axios.post(`${url}/api/voucher/validate`, {
                code,
                minOrderAmount: getTotalCartAmount()
            }, { headers: { token } });
    
            if (response.data.success) {
                const discountValue = parseFloat(response.data.voucher.discountPercent);
                setDiscount(discountValue);
                setDiscountAmount(getTotalCartAmount() * discountValue / 100);
                setMessage('Voucher successfully applied.');
                setPromoCode(code);
            } else {
                setDiscount(0);
                setDiscountAmount(0);
                setMessage(response.data.message);
                setPromoCode('');
            }
        } catch (error) {
            setDiscount(0);
            setDiscountAmount(0);
            setMessage('Voucher code does not exist or is ineligible.');
            setPromoCode('');
        }
    };

    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev)=>({...prev,[itemId]:1}))
        }
        else {
            setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}))
        }
        if (token) {    
            await axios.post(url + "/api/cart/add",{itemId},{headers:{token}})
        }

    }

    const removeFromCart = async (itemId) => {
        setCartItems((prev)=>({...prev,[itemId]:prev[itemId]-1}))
        if (token) {
            await axios.post(url + "/api/cart/remove",{itemId},{headers:{token}})
        }
    }

    const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
        if (cartItems[item] > 0) {
            let itemInfo = food_list.find((product) => product._id === item);
            
            if (itemInfo) {
                totalAmount += itemInfo.price * cartItems[item];
            }
        }
    }
    return totalAmount;
}

    const fetchFoodList = async() => {
        const response = await axios.get(url+"/api/food/list");
        setFoodList(response.data.data)
    }

    const loadCartData = async(token) => {
        const response = await axios.post(url+"/api/cart/get",{},{headers:{token}})
        setCartItems(response.data.cartData);
    }

    useEffect(()=>{
        if (discount > 0) {
          const discountValue = parseFloat(discount);
          setDiscountAmount(getTotalCartAmount() * discountValue / 100);
        }
      }, [cartItems, discount, getTotalCartAmount]);

    useEffect(()=>{

        async function  loadData() {
            await fetchFoodList();
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"));
                await loadCartData(localStorage.getItem("token"));
        }
        }
        loadData();
    },[])
    

    const clearCart = () => {
        setCartItems({});
    }

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        clearCart,
        promoCode,
        discount,
        discountAmount,
        message,
        applyPromoCode,
        setPromoCode,
        setMessage
    }
    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>

    )
}
export default StoreContextProvider