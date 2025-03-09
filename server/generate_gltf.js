import fs from 'fs';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';

// 获取命令行参数
const args = process.argv.slice(2);
const parameters = JSON.parse(args[0]);
const outputPath = args[1];

// 创建 Three.js 场景
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry(parameters.width || 10, parameters.height || 10, parameters.depth || 10);
const material = new THREE.MeshStandardMaterial({ color: parameters.color || 0xffffff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 导出 GLTF
const exporter = new GLTFExporter();
exporter.parse(scene, (gltf) => {
    fs.writeFileSync(outputPath, JSON.stringify(gltf));
    console.log(`GLTF 文件已保存到: ${outputPath}`);
}, { binary: false });
