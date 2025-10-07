import React, { useState } from 'react';
import axios from 'axios';
import { showToast } from '../Toasts';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState('');

  const navigate = useNavigate();

  const gererSoumission = async (e) => {
    e.preventDefault();
    setErrors('');

    const response = await axios.post('http://localhost:4000/api/login', {
      name,
      password: password,
    });
    if (response.data.error) {
      showToast("error", response.data.error)
    } else {
      showToast("success", response.data.message)
    }
    console.log(response.data.user);
  };

  return (
    <div class="flex flex-col items-center w-full">
      <h1 class="text-6xl font-caesar">Connexion</h1>
      <form
        class="flex items-center w-full justify-center gap-12 mt-[60px] mb-[30px]"
        onSubmit={gererSoumission}
      >
        <div class="flex flex-col gap-2 w-[30%]">
          <div class="flex flex-col items-center">
            <label>Prénom</label>
            <input
              class="rounded text-center w-full ring-1 ring-gray-300"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez votre prénom"
            />
          </div>
          <div class="flex flex-col items-center">
            <label>Mot de passe</label>
            <input
              class="rounded text-center w-full ring-1 ring-gray-300"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
            />
          </div>
          <button
            class="mt-[20px] rounded ring-1 ring-gray-300"
            type="submit"
            onClick={() => navigate("/home")}
          >
            S'inscrire
          </button>
        </div>
      </form>
      <div class="flex flex-col items-center justify-center">
        <p>Vous n'avez pas encore de compte ? </p>
        <Link class="underline" to="/register">
          Cliquez ici
        </Link>
      </div>
    </div>
  );
};

export default Login;