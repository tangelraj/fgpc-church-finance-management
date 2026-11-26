import {
  Construction,
  ArrowLeft,
} from "lucide-react";

import { Link } from "react-router-dom";


export default function ComingSoon({
  title,
}) {

  return (

    <div
      style={{
        minHeight: "450px",
        background: "#ffffff",
        border: "1px solid #ece5ef",
        borderRadius: "15px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        padding: "30px",
        textAlign: "center",
      }}
    >

      <Construction
        size={55}
        color="#b68a39"
      />

      <h1 style={{ color: "#54265f" }}>

        {title}

      </h1>

      <p style={{ color: "#918398" }}>

        This module will be implemented
        in the upcoming steps.

      </p>

      <Link
        to="/"
        className="primary-button"
      >

        <ArrowLeft size={17} />

        Back to Dashboard

      </Link>

    </div>

  );

}