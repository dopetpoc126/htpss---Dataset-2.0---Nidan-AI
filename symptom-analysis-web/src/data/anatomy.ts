export interface Organ {
    id: string;
    name: string;
    path: string; // SVG path d attribute
    color: string;
}

export const bodyOutlinePath = "M120 40 C 120 20, 180 20, 180 40 Q 180 60, 165 70 Q 200 80, 220 100 L 230 180 Q 235 220, 220 250 L 220 400 L 190 600 L 165 500 L 140 600 L 110 400 L 110 250 Q 95 220, 100 180 L 110 100 Q 130 80, 165 70 Q 150 60, 150 40";
// This is a simplified "human" shape. 
// Head: M120 40 ... 180 40
// Shoulders/Arms: ... 220 100
// Torso/Legs ...

export const organs: Organ[] = [
    {
        id: "brain",
        name: "Brain",
        path: "M135 25 C 135 15, 165 15, 165 25 C 170 35, 130 35, 135 25", // Crude brain in head
        color: "#FFB6C1", // LightPink
    },
    {
        id: "lungs",
        name: "Lungs",
        path: "M130 90 Q 110 130, 130 160 Q 140 160, 150 140 Q 160 160, 170 160 Q 190 130, 170 90 Q 150 110, 130 90",
        color: "#FF69B4", // HotPink
    },
    {
        id: "heart",
        name: "Heart",
        path: "M145 110 Q 135 100, 145 130 Q 160 140, 160 120 Q 160 100, 145 110",
        color: "#FF0000", // Red
    },
    {
        id: "stomach",
        name: "Stomach",
        path: "M145 170 Q 130 170, 135 200 Q 150 210, 160 190 Q 160 170, 145 170",
        color: "#FFA500", // Orange
    },
    {
        id: "liver",
        name: "Liver",
        path: "M130 165 Q 115 170, 125 190 L 145 180 Z",
        color: "#8B4513", // SaddleBrown
    },
    {
        id: "intestines",
        name: "Intestines",
        path: "M135 210 Q 125 240, 145 260 Q 165 240, 155 210 Z",
        color: "#DEB887", // BurlyWood
    }
];
