import React from "react";
import "./ProjectCard.css";

interface ProjectCardProps {
    name?: string;
    description?: string;
    imageUrl?: string;
    embedUrl?: string;
    projectUrl?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    name,
    description,
    imageUrl,
    embedUrl,
    projectUrl,
}) => {
    return (
        <div className="project-card">
            <h2>
                {embedUrl ? (
                    <a
                        href={embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-card-header-link"
                    >
                        {name}
                    </a>
                ) : (
                    <span className="project-card-header-link">{name}</span>
                )}
            </h2>
            <p>{description}</p>
            {embedUrl && (
                <iframe src={embedUrl} title={name} allowFullScreen></iframe>
            )}
            {imageUrl && <img src={imageUrl} alt={name} />}
            {projectUrl && (
                <a href={projectUrl} className="project-link">
                    View Project
                </a>
            )}
        </div>
    );
};

export default ProjectCard;
