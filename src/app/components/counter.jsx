"use client";
import { useEffect, useState } from "react";

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function Digit({ value }) {
    const offset = -value * 40; // digit height = 40px

    return (
        <div className="digit-window">
            <div
                className="digit-strip"
                style={{ transform: `translateY(${offset}px)` }}
            >
                {digits.map((d, i) => (
                    <div key={i} className="digit">
                        {d}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Counter({ value = "2292107" }) {
    return (
        <div className="counter-container">
            {value.split("").map((v, i) => (
                <Digit key={i} value={parseInt(v)} />
            ))}

            {/* Cam / kir overlay */}
            <div className="glass-overlay" />
        </div>
    );
}
