import axios from "axios";
import { createContext , useEffect, useState } from "react";
import { toast } from "react-hot-toast";


export const StoreContext = createContext(null)

const FAVORITE_PRODUCT_IDS_KEY = "favorite_product_ids";

const loadFavoritesFromStorage = () => {
    try {
        const raw = localStorage.getItem(FAVORITE_PRODUCT_IDS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return {};
        return Object.fromEntries(arr.map((id) => [String(id), true]));
    } catch {
        return {};
    }
};

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});
    const [favorites, setFavorites] = useState(loadFavoritesFromStorage);

    const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    const [token,setToken] = useState("")
    const [food_list,setFoodList] = useState([])
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [message, setMessage] = useState('');
    const [stockAlertItemId, setStockAlertItemId] = useState("");
    const [stockAlertTick, setStockAlertTick] = useState(0);


    const applyPromoCode = async (code) => {
        try {
            const response = await axios.post(`${url}/api/voucher/validate`, {
                code,
                cartSubtotal: getTotalCartAmount()
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
            const serverMsg = error.response?.data?.message;
            setMessage(
                typeof serverMsg === 'string' && serverMsg.trim()
                    ? serverMsg
                    : 'Voucher code does not exist or is ineligible.'
            );
            setPromoCode('');
        }
    };

    const addToCart = async (itemId) => {
        const product = food_list.find((item) => String(item._id) === String(itemId));
        const stock = Number(product?.stock ?? 20);
        const currentQuantity = Number(cartItems[itemId] || 0);

        if (currentQuantity >= stock) {
            setStockAlertItemId(String(itemId));
            setStockAlertTick((prev) => prev + 1);
            toast.error(`Only ${stock} item(s) in stock`);
            return false;
        }

        if (!cartItems[itemId]) {
            setCartItems((prev)=>({...prev,[itemId]:1}))
        }
        else {
            setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}))
        }

        if (token) {    
            await axios.post(url + "/api/cart/add",{itemId},{headers:{token}})
        }

        return true;
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
            let itemInfo = food_list.find((product) => String(product._id) === String(item));
            
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
        const intervalId = setInterval(() => {
            fetchFoodList();
        }, 5000);
        return () => clearInterval(intervalId);
    },[])
    

    const clearCart = () => {
        setCartItems({});
    }

    const toggleFavorite = (itemId) => {
        const key = String(itemId);
        setFavorites((prev) => {
            const next = { ...prev };
            if (next[key]) delete next[key];
            else next[key] = true;
            return next;
        });
    };

    const isFavorite = (itemId) => !!favorites[String(itemId)];

    useEffect(() => {
        localStorage.setItem(
            FAVORITE_PRODUCT_IDS_KEY,
            JSON.stringify(Object.keys(favorites))
        );
    }, [favorites]);

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
        favorites,
        toggleFavorite,
        isFavorite,
        promoCode,
        discount,
        discountAmount,
        message,
        applyPromoCode,
        setPromoCode,
        setMessage,
        stockAlertItemId,
        stockAlertTick
    }
    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>

    )
}
export default StoreContextProvider