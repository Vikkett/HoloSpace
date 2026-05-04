import {
    init,
    toggleChat,
    inferVibe,
    inferEnergy
  } from "../src/js/ai-universe.js";



// mock globals BEFORE import
global.THREE = {
    Scene: jest.fn(() => ({ add: jest.fn(), fog: { color: { setHex: jest.fn() }, density: 0 } })),
    PerspectiveCamera: jest.fn(() => ({ position: { set: jest.fn() } })),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        domElement: document.createElement('canvas')
    })),
    OrbitControls: jest.fn(() => ({ update: jest.fn() })),
    AmbientLight: jest.fn(),
    PointLight: jest.fn(),
    SphereGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(),
    Mesh: jest.fn(() => ({ scale: { setScalar: jest.fn() } })),
    BufferGeometry: jest.fn(() => ({ setAttribute: jest.fn() })),
    Float32BufferAttribute: jest.fn(),
    Points: jest.fn(),
    PointsMaterial: jest.fn(),
    FogExp2: jest.fn(() => ({ color: { setHex: jest.fn() } })),
    Color: jest.fn(),
};

global.crypto = { randomUUID: () => "test-id" };

document.body.innerHTML = `
<div id="chat-window"></div>
<div id="chat-history"></div>
<input id="user-input" />
<button id="send-btn"></button>
`;

// import AFTER mocks
require('../src/js/ai-universe.js');

describe("Basic UI tests", () => {

    test("toggleChat toggles class", () => {
        const el = document.getElementById("chat-window");
        el.classList.toggle = jest.fn();

        window.toggleChat();

        expect(el.classList.toggle).toHaveBeenCalledWith("active");
    });

    test("addMsg adds message", () => {
        const history = document.getElementById("chat-history");

        window.addMsg("hello", "ai");

        expect(history.children.length).toBe(1);
        expect(history.children[0].innerHTML).toBe("hello");
    });

});

describe("Logic tests", () => {

    test("inferVibe works", () => {
        expect(window.inferVibe("dark mood")).toBe("lonely");
        expect(window.inferVibe("energetic")).toBe("energetic");
        expect(window.inferVibe("dreamy")).toBe("mystique");
        expect(window.inferVibe("random")).toBe("neutral");
    });

    test("inferEnergy works", () => {
        expect(window.inferEnergy("calme")).toBe("low");
        expect(window.inferEnergy("intense")).toBe("high");
        expect(window.inferEnergy("random")).toBe("medium");
    });

    test("fillMissing adds planets", () => {
        const result = window.fillMissing([{ name: "A" }]);

        expect(result.length).toBe(5);
    });

});