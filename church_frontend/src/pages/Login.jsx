import { useState } from "react";

import {

  Church,

  UserRound,

  LockKeyhole,

  Eye,

  EyeOff,

  ShieldCheck,

  ArrowRight,

  LoaderCircle,

} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../styles/Login.css";


export default function Login() {

  const navigate = useNavigate();

  const { login } = useAuth();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);


  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    setLoading(true);

    try {

      await login(username, password);

      navigate("/", { replace: true });

    } catch (err) {

      const data = err.response?.data;

      setError(

        data?.non_field_errors?.[0] ||

        data?.detail ||

        "Unable to sign in. Check your credentials and server connection."

      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="login-page">

      <div className="login-card">

        <div className="login-brand">

          <div className="login-logo">

            <Church size={38} />

          </div>

          <span className="praise-text">

            PRAISE THE LORD

          </span>

          <h1>FGPC YELAHANKA</h1>

          <p>

            Church Finance Management System

          </p>

        </div>


        <div className="login-divider" />


        <div className="login-heading">

          <h2>Welcome Back</h2>

          <p>

            Sign in to manage your church finances.

          </p>

        </div>


        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        <form onSubmit={handleSubmit}>

          <div className="login-form-group">

            <label htmlFor="username">

              Username

            </label>

            <div className="login-input">

              <UserRound size={20} />

              <input

                id="username"

                type="text"

                placeholder="Enter your username"

                value={username}

                onChange={(e) =>
                  setUsername(e.target.value)
                }

                autoComplete="username"

                required

              />

            </div>

          </div>


          <div className="login-form-group">

            <label htmlFor="password">

              Password

            </label>

            <div className="login-input">

              <LockKeyhole size={20} />

              <input

                id="password"

                type={
                  showPassword ? "text" : "password"
                }

                placeholder="Enter your password"

                value={password}

                onChange={(e) =>
                  setPassword(e.target.value)
                }

                autoComplete="current-password"

                required

              />

              <button

                type="button"

                className="password-toggle"

                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }

                onClick={() =>
                  setShowPassword(!showPassword)
                }

              >

                {showPassword ? (

                  <EyeOff size={20} />

                ) : (

                  <Eye size={20} />

                )}

              </button>

            </div>

          </div>


          <button

            type="submit"

            className="login-submit"

            disabled={loading}

          >

            {loading ? (

              <>

                <LoaderCircle
                  size={20}
                  className="login-spinner"
                />

                Signing In...

              </>

            ) : (

              <>

                Sign In

                <ArrowRight size={20} />

              </>

            )}

          </button>

        </form>


        <div className="login-security">

          <ShieldCheck size={18} />

          Authorized Church Staff Only

        </div>


        <div className="login-verse">

          <p>

            “Let all things be done decently
            and in order.”

          </p>

          <span>

            1 Corinthians 14:40

          </span>

        </div>

      </div>

      <div className="login-copyright">

        © {new Date().getFullYear()} FGPC Yelahanka.
        All Rights Reserved.

      </div>

    </div>

  );

}