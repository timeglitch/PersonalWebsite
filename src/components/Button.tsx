import React from "react";
import "./Button.css";

interface ButtonProps {
    href: string;
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "github" | "linkedin" | "resume";
    target?: "_blank" | "_self";
    rel?: string;
}

const Button: React.FC<ButtonProps> = ({
    href,
    children,
    variant = "primary",
    target = "_blank",
    rel = "noopener noreferrer",
}) => {
    return (
        <a
            href={href}
            target={target}
            rel={rel}
            className={`button button--${variant}`}
        >
            {children}
        </a>
    );
};

export default Button;
