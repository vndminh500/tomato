import { assets } from '../../assets/assets';
import './MobileApp.css';

const appHighlights = [
  'Order faster with a mobile-optimized interface.',
  'Track your order in real time from confirmation to delivery.',
  'Receive exclusive offers available only to app users.',
];

const MobileApp = () => {
  return (
    <section className='mobile-app-page'>
      <div className='mobile-app-hero'>
        <span className='mobile-app-badge'>EatUp Mobile</span>
        <h1>Download EatUp App</h1>
        <p>
        Enhance your trail-building experience anytime, anywhere with this fast, compact, and easy-to-use mobile app.
        </p>
      </div>

      <div className='mobile-app-content'>
        <ul className='mobile-app-highlights'>
          {appHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className='mobile-app-platforms'>
          <img src={assets.play_store} alt='Download on Google Play' />
          <img src={assets.app_store} alt='Download on App Store' />
        </div>
      </div>
    </section>
  );
};

export default MobileApp;
