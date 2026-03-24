import React from 'react';
import './Description.css';

const Description = ({ productName }) => {
    return (
        <div className="product-description">
            <h2>Detailed Description</h2>
            <p>
                Our signature dish, the {productName}, is a culinary masterpiece crafted with the finest ingredients and a passion for flavor. This dish features a succulent, perfectly cooked main ingredient, seasoned with a unique blend of exotic herbs and spices that will tantalize your taste buds. The rich and savory flavors are balanced with a hint of sweetness, creating a truly unforgettable dining experience.
            </p>
            <p>
                Accompanied by a side of fresh, crisp seasonal vegetables and a vibrant, house-made sauce, every bite is a delightful explosion of textures and tastes. The main ingredient is sourced from local farms, ensuring the highest quality and freshness. We take pride in our commitment to sustainable and ethical sourcing, so you can feel good about what you're eating. Whether you're a connoisseur of fine food or simply looking for a satisfying meal, the {productName} is sure to exceed your expectations.
            </p>
            <h3>Nutritional Information</h3>
            <ul>
                <li>Calories: 450-550 kcal</li>
                <li>Protein: 30g</li>
                <li>Fat: 20g</li>
                <li>Carbohydrates: 40g</li>
            </ul>
            <h3>Allergen Information</h3>
            <p>
                Contains: Gluten, Dairy. May contain traces of nuts. Please inform our staff of any allergies. Our kitchen handles a variety of ingredients, so we cannot guarantee a completely allergen-free environment.
            </p>
            <h3>Cooking Process</h3>
            <p>
                The {productName} is prepared by our expert chefs using a combination of traditional and modern cooking techniques. The main ingredient is slow-cooked to perfection, locking in all the natural juices and flavors. It is then pan-seared to create a crispy exterior while maintaining a tender and moist interior. The dish is then artfully plated and garnished with fresh herbs, ready to be enjoyed.
            </p>
        </div>
    );
};

export default Description;
