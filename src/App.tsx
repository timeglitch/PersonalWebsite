//import { useState } from "react";
import "./App.css";
import ProjectCard from "./components/ProjectCard";
import Button from "./components/Button";

function App() {
    return (
        <div className="app-container">
            <div className="hero-section">
                <h1 className="hero-title">Frank's Portfolio</h1>
                <p className="hero-subtitle">
                    Hi, I'm Frank and I write software to solve problems.
                </p>
                <Button href="https://github.com/timeglitch" variant="github">
                    View My GitHub
                </Button>
                <Button
                    href="https://docs.google.com/document/d/1Ngmw-ZuhaUzupvgZQvM-1YMePI2_ZzQVlHGfEHZp_2Q/edit?usp=sharing"
                    variant="resume"
                >
                    View My Resume
                </Button>
                <Button
                    href="https://www.linkedin.com/in/frankjzhang/"
                    variant="linkedin"
                >
                    Connect on LinkedIn
                </Button>
                {/*TODO: add about me, profile picture, contact info*/}
            </div>

            <h2 className="section-title">Projects</h2>
            <div className="projects-grid">
                <ProjectCard
                    name="Vocalize"
                    description="Help people learn vowel sounds for Spanish using live audio processing and visualizations. A novel application for accessible biofeedback in language learning. Built with React and Typescript."
                    embedUrl="https://vocalize-web-ten.vercel.app/"
                />
                <ProjectCard
                    name="SJSU Parking Tracker"
                    description="A tracker for parking availability at San Jose State University. Built with React and a Python backend."
                    embedUrl="https://timeglitch.github.io/SJSUParkingMonitor/"
                />
                <ProjectCard
                    name="Satellite Tracker"
                    description="Visualize interpolated satellite data overlayed on EONET wildfire locations. Built with React, Three.js and a serverless proxy."
                    embedUrl="https://windborne-nu.vercel.app/"
                />
                <ProjectCard
                    name="San Francisco Balalaika Ensemble Website"
                    description="A website for the San Francisco Balalaika Ensemble, a local music group. Built in raw HTML/CSS/JavaScript, to make it as easy as possible to update and host."
                    embedUrl="https://sfbalalaika.org"
                />
                <ProjectCard
                    name="Asset System GUI"
                    description="A graphical user interface for Center for High Throughput Computing assets. Built with Python and Tkinter on top of custom database."
                />
            </div>
        </div>
    );
}

export default App;
