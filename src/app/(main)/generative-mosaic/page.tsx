"use client"

import { Grid, Row, Column } from "@once-ui-system/core"
import { useEffect, useRef } from "react"

export default function GenerativeMosaic() {
    const leafRef = useRef<HTMLDivElement>(null)

    type Corner = 'top,left' | 'top,right' | 'bottom,right' | 'bottom,left';

    interface BorderRadiusCorners {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
    }

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        
        function animateLoop() {
            animateLeaf();
            // Schedule next animation after current one completes (1s) + buffer time
            timeoutId = setTimeout(animateLoop, 1000);
        }
        
        // Start the animation loop
        animateLoop();
        
        // Cleanup on unmount
        return () => clearTimeout(timeoutId);
    }, [])

    function animateLeaf() {
        if (leafRef.current) {
            const corners = findCorners(leafRef.current)
            console.log(corners)
            const columns = 6
            const totalCells = 12
            const possibleMovements = getPossibleMovements(leafRef.current, columns, totalCells)
            console.log(possibleMovements)
            const randomMovement = possibleMovements[chooseRandomFromOptions(possibleMovements.length)]
            console.log(randomMovement)
            const possibleCornerOrigins = findPossibleCornerOrigin(randomMovement, corners)
            console.log(possibleCornerOrigins)
            const randomCornerOrigin = possibleCornerOrigins[chooseRandomFromOptions(possibleCornerOrigins.length)]
            console.log(randomCornerOrigin)
            updateTransformOrigin(leafRef.current, randomCornerOrigin)
            moveLeaf(leafRef.current, randomMovement, randomCornerOrigin)
        }
    }


    function moveLeaf(leafElement: HTMLElement, movement: string, transformOrigin: Corner) {
        // Determine rotation direction based on movement and transform origin
        const rotationDegrees = getRotationDegrees(movement, transformOrigin);

        // Apply transition properties
        leafElement.style.transition = 'transform .5s ease';

        // Apply the rotation
        leafElement.style.transform = `rotate(${rotationDegrees}deg)`;

        // After rotation completes, update position and reset rotation
        setTimeout(() => {
            // Calculate new position based on movement
            const actualCellSize = leafElement.offsetHeight;
            const currentLeft = parseFloat(window.getComputedStyle(leafElement).left) || 0;
            const currentTop = parseFloat(window.getComputedStyle(leafElement).top) || 0;

            let newLeft = currentLeft;
            let newTop = currentTop;

            switch (movement) {
                case 'right':
                    newLeft += actualCellSize;
                    break;
                case 'left':
                    newLeft -= actualCellSize;
                    break;
                case 'bottom':
                    newTop += actualCellSize;
                    break;
                case 'top':
                    newTop -= actualCellSize;
                    break;
            }

            const currentBorderRadius = window.getComputedStyle(leafElement).borderRadius;
            const newBorderRadius = calculateNewBorderRadius(currentBorderRadius, rotationDegrees);

            // Update position and reset transform
            leafElement.style.transition = 'none';
            leafElement.style.left = `${newLeft}px`;
            leafElement.style.top = `${newTop}px`;
            leafElement.style.transform = 'rotate(0deg)';
            leafElement.style.borderRadius = newBorderRadius

            // Re-enable transitions after a frame
            requestAnimationFrame(() => {
                leafElement.style.transition = '';
            });
        }, 500);
    }

    function calculateNewBorderRadius(currentBorderRadius: string, rotationDegrees: number): string {
        // Parse current border radius to get the corner values
        const corners = parseBorderRadius(currentBorderRadius);

        // Normalize rotation to 0-360 range
        const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;

        // Determine how many 90-degree steps we've rotated
        const steps = Math.round(normalizedRotation / 90);

        // Create array of corner values in order: [TL, TR, BR, BL]
        const cornerArray = [
            corners.topLeft,
            corners.topRight,
            corners.bottomRight,
            corners.bottomLeft
        ];

        // Rotate the array based on the rotation direction
        // Positive rotation (clockwise) moves corners counter-clockwise in the array
        // Negative rotation (counter-clockwise) moves corners clockwise in the array
        const rotatedCorners = rotateArray(cornerArray, -steps); // Negative because corners move opposite to rotation

        // Convert back to CSS border-radius string
        // If all corners are the same, return single value
        if (rotatedCorners.every(val => val === rotatedCorners[0])) {
            return rotatedCorners[0] === 0 ? '0' : `${rotatedCorners[0]}%`;
        }

        // Otherwise return all four values
        return rotatedCorners.map(val => val === 0 ? '0' : `${val}%`).join(' ');
    }

    function rotateArray<T>(arr: T[], steps: number): T[] {
        const len = arr.length;
        const normalizedSteps = ((steps % len) + len) % len;
        return [...arr.slice(normalizedSteps), ...arr.slice(0, normalizedSteps)];
    }

    function getRotationDegrees(movement: string, transformOrigin: Corner): number {
        // Map to determine rotation based on movement direction and pivot point
        const rotationMap: Record<string, Record<Corner, number>> = {
            'right': {
                'top,left': 0,
                'bottom,left': 0,
                'top,right': -90,
                'bottom,right': 90
            },
            'left': {
                'top,right': 0,
                'bottom,right': 0,
                'top,left': 90,
                'bottom,left': -90
            },
            'bottom': {
                'top,left': 0,
                'top,right': 0,
                'bottom,left': 90,
                'bottom,right': -90
            },
            'top': {
                'bottom,left': 0,
                'bottom,right': 0,
                'top,left': -90,
                'top,right': 90
            }
        };

        return rotationMap[movement]?.[transformOrigin] || 0;
    }


    function updateTransformOrigin(targetElement: HTMLElement, origin: Corner) {
        // origin is a string like 'top,left' we need to convert it to a string like 'top left'
        const originString = origin.replace(',', ' ')
        targetElement.style.transformOrigin = originString
    }

    function findCorners(element: HTMLElement): Corner[] {
        // Get the computed border-radius style
        const computedStyle = window.getComputedStyle(element);
        const borderRadius = computedStyle.borderRadius;

        // If no border-radius or empty, all corners are 90 degrees
        if (!borderRadius || borderRadius === '' || borderRadius === 'none') {
            return ['top,left', 'top,right', 'bottom,right', 'bottom,left'];
        }

        // Parse border-radius values
        const corners = parseBorderRadius(borderRadius);

        // Find corners with 90-degree angles (radius = 0)
        const sharpCorners: Corner[] = [];

        if (corners.topLeft === 0) sharpCorners.push('top,left');
        if (corners.topRight === 0) sharpCorners.push('top,right');
        if (corners.bottomRight === 0) sharpCorners.push('bottom,right');
        if (corners.bottomLeft === 0) sharpCorners.push('bottom,left');

        return sharpCorners;
    }

    function parseBorderRadius(borderRadius: string): BorderRadiusCorners {
        // Clean the string and split by spaces
        const values = borderRadius.trim().split(/\s+/);

        // Convert values to numbers (0 for 0px, 0%, etc.)
        const numericValues = values.map((value: string): number => {
            if (value === '0' || value === '0px' || value === '0%') {
                return 0;
            }
            // For non-zero values, return a positive number
            return parseFloat(value) || 1;
        });

        // Handle different number of values according to CSS spec
        let topLeft: number, topRight: number, bottomRight: number, bottomLeft: number;

        switch (numericValues.length) {
            case 1:
                // All corners same value
                topLeft = topRight = bottomRight = bottomLeft = numericValues[0];
                break;
            case 2:
                // First value: top-left and bottom-right
                // Second value: top-right and bottom-left
                topLeft = bottomRight = numericValues[0];
                topRight = bottomLeft = numericValues[1];
                break;
            case 3:
                // First value: top-left
                // Second value: top-right and bottom-left
                // Third value: bottom-right
                topLeft = numericValues[0];
                topRight = bottomLeft = numericValues[1];
                bottomRight = numericValues[2];
                break;
            case 4:
                // All corners specified individually
                topLeft = numericValues[0];
                topRight = numericValues[1];
                bottomRight = numericValues[2];
                bottomLeft = numericValues[3];
                break;
            default:
                // Fallback - treat as no radius
                topLeft = topRight = bottomRight = bottomLeft = 0;
        }

        return {
            topLeft,
            topRight,
            bottomRight,
            bottomLeft
        };
    }


    function getPossibleMovements(leafElement: HTMLElement, gridColumns: number, totalCells: number): string[] {
        // Get current position from the leaf element's style
        const computedStyle = window.getComputedStyle(leafElement);
        const parentElement = leafElement.parentElement;
        if (!parentElement) return [];

        // Calculate cell dimensions (assuming square cells)
        const cellSize = parseFloat(leafElement.style.height); // 8rem in your case

        // Get current position in pixels
        const currentLeft = parseFloat(computedStyle.left) || 0;
        const currentTop = parseFloat(computedStyle.top) || 0;

        // Convert pixel position to grid coordinates
        // We need to get the actual pixel value of the cell size
        const actualCellSize = leafElement.offsetHeight; // This gives us the pixel height

        const currentCol = Math.round(currentLeft / actualCellSize);
        const currentRow = Math.round(currentTop / actualCellSize);

        // Calculate grid dimensions
        const gridRows = Math.ceil(totalCells / gridColumns);

        const possibleMoves: string[] = [];

        // Check each direction
        if (currentRow > 0) possibleMoves.push('top');
        if (currentRow < gridRows - 1) possibleMoves.push('bottom');
        if (currentCol > 0) possibleMoves.push('left');
        if (currentCol < gridColumns - 1) possibleMoves.push('right');

        return possibleMoves;
    }

    function chooseRandomFromOptions(amountOfOptions: number) {
        // pick a random number between 0 and the amount of options - 1
        const randomNumber = Math.floor(Math.random() * amountOfOptions)
        return randomNumber
    }

    function findPossibleCornerOrigin(movement: string, corners: Corner[]) {
        return corners.filter(corner => corner.includes(movement))
    }


    return (
        <Column fillWidth center padding="l" style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
            <Column maxWidth="l" center gap="l" border="neutral-alpha-medium" radius="xs-8" background="neutral-alpha-weak" style={{ aspectRatio: "16/9", padding: "4rem 5rem" }}>
                <Grid
                    columns="6"
                    style={{ alignItems: "start", justifyContent: "start", gap: "0", position: "relative", overflow: "hidden" }}
                >
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <Row fill background="neutral-alpha-weak" border="neutral-alpha-medium" style={{ aspectRatio: "1/1", height: "8rem" }} />
                    <div
                        ref={leafRef}
                        style={{
                            aspectRatio: "1/1",
                            height: "8rem",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            background: "#D3D3D3",
                            borderRadius: "0 100% 0 0"
                        }} />
                </Grid>
            </Column>
        </Column>
    )
}