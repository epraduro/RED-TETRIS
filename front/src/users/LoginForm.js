import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showToast } from '../Toasts';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Login = () => {

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const tempToken = localStorage.getItem("token");

    if (tempToken !== null) {
      navigate("/home");
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors('');

    const response = await axios.post('http://10.18.198.45:4000/api/login', {
      name,
      password,
    });
    if (response.data.error) {
      showToast("error", response.data.error)
    } else {
      localStorage.setItem('token', response.data.token);
      showToast("success", response.data.message)
      navigate("/home");
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-6xl font-caesar">Connexion</h1>
      <form
        className="flex items-center w-full justify-center gap-12 mt-[60px] mb-[30px]"
        onSubmit={handleLogin}
      >
        <div className="flex flex-col gap-2 w-[30%]">
          <div className="flex flex-col items-center">
            <label>Name</label>
            <input
              className="rounded text-center w-full ring-1 ring-gray-300"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entry your name"
            />
          </div>
          <div className="flex flex-col items-center">
            <label>Password</label>
            <input
              className="rounded text-center w-full ring-1 ring-gray-300"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entry your password"
            />
          </div>
          <button
            className="mt-[20px] rounded ring-1 ring-gray-300"
            type="submit"
          >
            Sign In
          </button>
        </div>
      </form>
      <div className="flex flex-col items-center justify-center">
        <p>Don't have an account yet?</p>
        <Link className="underline" to="/register">
          Click here
        </Link>
      </div>
    </div>
  );
};

export default Login;