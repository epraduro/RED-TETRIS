import React, { useState } from "react";
import axios from "axios";
import { showToast } from "../Toasts";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [verifPassword, setVerifPassword] = useState("");
  const [errors, setErrors] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors("");

    const response = await axios.post("http://localhost:4000/api/register", {
      name,
      password,
    });
    if (response.data.error) {
      showToast("error", response.data.error);
    } else {
      localStorage.setItem('token', response.data.token);
      showToast("success", response.data.message);
      navigate("/home");
    }
    console.log(response.data.user);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-6xl font-caesar">Inscription</h1>
      <form
        className="flex items-center w-full justify-center gap-12 mt-[60px] mb-[30px]"
        onSubmit={handleRegister}
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
          <div className="flex flex-col items-center">
            <label>Confirm password</label>
            <input
              className="rounded text-center w-full ring-1 ring-gray-300"
              type="password"
              value={verifPassword}
              onChange={(e) => setVerifPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>
          <button
            disabled={
              !(name && password && verifPassword && password === verifPassword)
            }
            className="mt-[20px] rounded ring-1 ring-gray-300"
            type="submit"
          >
            Sign Up
          </button>
        </div>
      </form>
      <div className="flex flex-col items-center justify-center">
        <p>Do you already have an account? </p>
        <Link className="underline" to="/login">
          Click here
        </Link>
      </div>
    </div>
  );
};

export default Register;
