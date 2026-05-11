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

    const response = await axios.post(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/login`, {
      name,
      password,
    });

    if (response.data.error) {
      showToast("error", response.data.error)
    } else {
      localStorage.setItem('token', response.data.token);
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-violet-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-blue-800 rounded-lg opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-caesar text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 pb-4 drop-shadow-2xl">
            RED-TETRIS
          </h1>
          <h2 className="text-3xl font-bold text-indigo-200 mt-4">Connexion</h2>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-violet-500/50 rounded-2xl p-8 shadow-2xl shadow-violet-900/50">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-indigo-200 font-medium text-sm">Nom d'utilisateur</label>
              <input
                className="w-full bg-slate-950/80 backdrop-blur-sm border-2 border-indigo-400/50 rounded-xl px-4 py-3 text-indigo-100 placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-indigo-200 font-medium text-sm">Mot de passe</label>
              <input
                className="w-full bg-slate-950/80 backdrop-blur-sm border-2 border-indigo-400/50 rounded-xl px-4 py-3 text-indigo-100 placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
              />
            </div>

            {/* Submit Button */}
            <button
              disabled={!(name && password)}
              className="w-full bg-gradient-to-r from-indigo-700 to-violet-700 hover:from-indigo-600 hover:to-violet-600 disabled:from-slate-800 disabled:to-slate-700 disabled:cursor-not-allowed text-indigo-100 font-bold py-4 px-6 rounded-xl border-2 border-indigo-400/50 hover:border-violet-400 disabled:border-slate-600 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-violet-500/50 text-lg mt-2"
              type="submit"
            >
              {!(name && password) 
                ? "Remplissez tous les champs" 
                : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-8 text-center bg-slate-900/60 backdrop-blur-sm border-2 border-indigo-500/50 rounded-lg p-4">
          <p className="text-indigo-200 mb-2">Vous n'avez pas encore de compte ?</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-violet-300 hover:text-violet-200 transition-colors duration-300 font-medium underline"
          >
            Cliquez ici pour vous inscrire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;