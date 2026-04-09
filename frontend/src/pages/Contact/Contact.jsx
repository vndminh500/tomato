import './Contact.css';

const Contact = () => {
  return (
    <section className='contact-page'>
      <div className='contact-hero'>
        <h1>Contact Us</h1>
        <p>
          Have a question about your order, partnership, or support? Our team is
          ready to help you.
        </p>
      </div>

      <div className='contact-grid'>
        <article className='contact-card'>
          <h2>Customer Support</h2>
          <p>Phone: +84 123 456 789</p>
          <p>Email: eatup@gmail.com</p>
          <p>Hours: 08:00 - 22:00 (GMT+7)</p>
        </article>

        <article className='contact-card'>
          <h2>Office</h2>
          <p>EatUp Food App</p>
          <p>123 Nguyen Hue Street, District 1</p>
          <p>Ho Chi Minh City, Vietnam</p>
        </article>
      </div>
    </section>
  );
};

export default Contact;
