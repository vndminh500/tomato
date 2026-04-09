import React from 'react'
import './AppDownload.css'
import { assets } from '../../assets/assets'

const AppDownload = () => {
  return (
    <section className='app-download' id='app-download'>
      <span className='app-download-badge'>Mobile Experience</span>
      <p className='app-download-title'>
        For Better Experience Download <br /> EatUp App
      </p>
      <p className='app-download-subtitle'>
        Order faster, track deliveries in real time, and unlock app-only offers every day.
      </p>

      <div className="app-download-platforms">
        <img src={assets.play_store} alt="Download on Google Play" />
        <img src={assets.app_store} alt="Download on App Store" />
      </div>
    </section>
  )
}

export default AppDownload
