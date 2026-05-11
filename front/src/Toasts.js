import React from 'react';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const showToast = (type, message) => {
    const config = {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
    };

    switch (type) {
        case "success":
            toast.success(message, config);
            break;
        case "error":
            toast.error(message, config);
            break;
        case "info":
            toast.info(message, config);
            break;
        case "warning":
            toast.warning(message, config);
            break;
        default:
            toast(message, config);
            break;
    }
};