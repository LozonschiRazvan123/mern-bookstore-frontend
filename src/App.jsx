import React from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import BookCatalog from './components/BookCatalog'; 
import PaymentSuccess from './components/PaymentSuccess';
import AdminLogin from "./components/admin/AdminLogin";
import ProductAdministration from './components/admin/ProductAdmin';
// import './App.css'; 
 
const App = () => { 
  return ( 
    <Router> 
      <Routes> 
        <Route path="/" element={<BookCatalog />} /> 
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/products" element={<ProductAdministration />} />
      </Routes> 
    </Router> 
  ); 
}; 
 
export default App;

