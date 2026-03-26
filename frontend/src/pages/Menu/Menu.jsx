import { useEffect, useState } from 'react';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';

const Menu = () => {
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [category]);

  return (
    <div>
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay
        category={category}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={12}
        showPagination={true}
        title='All Menu Items'
      />
    </div>
  );
};

export default Menu;
