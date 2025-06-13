import { LottieAnimationInstance, LottieData, LottieProperty, LottiePropertyType, RgbColor, RgbTuple } from "./interfaces";
import { parseColor } from "./parsers";
import { set } from "./utils";

/**
 * Converts a color component to a two-digit hexadecimal string.
 * @param c Color component (0-255).
 * @returns Two-character hexadecimal string.
 */
function componentToHex(c: number) {
    const hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
}

/**
 * Converts a color component from 0-255 range to a normalized value (0-1).
 * @param Color component (0-255).
 * @returns Normalized value (0-1), rounded to three decimal places.
 */
function toUnitVector(n: number) {
    return Math.round((n / 255) * 1000) / 1000;
}

/**
 * Converts a normalized color value (0-1) to a color component (0-255).
 * @param Normalized value (0-1).
 * @returns Color component (0-255), rounded to the nearest integer.
 */
function fromUnitVector(n: number) {
    return Math.round(n * 255);
}

/**
 * Converts an RGB color object to a hexadecimal color string.
 * @param value Color object with r, g, b properties.
 * @returns Hexadecimal color string (e.g., "#ff0000").
 */
export function rgbToHex(value: RgbColor): string {
    return (
        '#' +
        componentToHex(value.r) +
        componentToHex(value.g) +
        componentToHex(value.b)
    );
}

/**
 * Converts a hexadecimal color string to an RGB color object.
 * @param hex Hexadecimal color string (with or without "#").
 * @returns RgbColor object with r, g, b properties.
 */
export function hexToRgb(hex: string): RgbColor {
    let data = parseInt(hex[0] != '#' ? hex : hex.substring(1), 16);
    return {
        r: (data >> 16) & 255,
        g: (data >> 8) & 255,
        b: data & 255,
    };
}

/**
 * Converts a hexadecimal color string to an RGB tuple in the 0-1 range.
 * @param hex Hexadecimal color string.
 * @returns RgbTuple with values normalized to 0-1.
 */
export function hexToTupleColor(hex: string): RgbTuple {
    const {
        r,
        g,
        b
    } = hexToRgb(hex);
    return [toUnitVector(r), toUnitVector(g), toUnitVector(b)];
}

/**
 * Converts an RGB tuple (0-1 range) to a hexadecimal color string.
 * @param value RgbTuple with values in the 0-1 range.
 * @returns Hexadecimal color string.
 */
export function tupleColorToHex(value: RgbTuple): string {
    const color: RgbColor = {
        r: fromUnitVector(value[0]),
        g: fromUnitVector(value[1]),
        b: fromUnitVector(value[2]),
    };
    return rgbToHex(color);
}

/**
 * Extracts all supported customizable properties from Lottie data.
 * @param data Lottie animation data.
 * @param options Extraction options (e.g., lottieInstance: boolean).
 * @returns Array of LottieProperty objects describing customizable properties.
 */
export function extractLottieProperties(
    data: LottieData,
    { lottieInstance }: { lottieInstance?: boolean } = {},
): LottieProperty[] {
    const result: any[] = [];

    if (!data || !data.layers) {
        return result;
    }

    data.layers.forEach((layer: any, layerIndex: number) => {
        if (!layer.nm || !layer.ef) {
            return;
        }

        layer.ef.forEach((field: any, fieldIndex: number) => {
            const value = field?.ef?.[0]?.v?.k;
            if (value === undefined) {
                return;
            }

            let path: string | undefined;

            if (lottieInstance) {
                path = `renderer.elements.${layerIndex}.effectsManager.effectElements.${fieldIndex}.effectElements.0.p.v`;
            } else {
                path = `layers.${layerIndex}.ef.${fieldIndex}.ef.0.v.k`;
            }

            let type: LottiePropertyType | undefined;

            if (field.mn === 'ADBE Color Control') {
                type = 'color';
            } else if (field.mn === 'ADBE Slider Control') {
                type = 'slider';
            } else if (field.mn === 'ADBE Point Control') {
                type = 'point';
            } else if (field.mn === 'ADBE Checkbox Control') {
                type = 'checkbox';
            } else if (field.mn.startsWith('Pseudo/')) {
                type = 'feature';
            }

            if (!type) {
                return;
            }

            const name = field.nm.toLowerCase();

            result.push({
                name,
                path,
                value,
                type,
            });
        });
    });

    return result;
}

/**
 * Resets Lottie data or animation instance to default values for the given properties.
 * @param data Lottie data or animation instance to reset.
 * @param properties Array of properties to reset.
 */
export function resetLottieProperties(
    data: LottieData | LottieAnimationInstance,
    properties: LottieProperty[],
) {
    for (const property of properties) {
        set(data, property.path, property.value);
    }
}

/**
 * Updates Lottie data or animation instance with a new value for the given properties.
 * Handles color, point, and other property types accordingly.
 * @param data Lottie data or animation instance to update.
 * @param properties Array of properties to update.
 * @param value New value to set for each property.
 */
export function updateLottieProperties(
    data: LottieData | LottieAnimationInstance,
    properties: LottieProperty[],
    value: any,
) {
    for (const property of properties) {
        if (property.type === 'color') {
            if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
                set(data, property.path, [toUnitVector(value.r), toUnitVector(value.g), toUnitVector(value.b)]);
            } else if (Array.isArray(value)) {
                set(data, property.path, value);
            } else if (typeof value === 'string') {
                set(data, property.path, hexToTupleColor(parseColor(value)));
            }
        } else if (property.type === 'point') {
            if (typeof value === 'object' && 'x' in value && 'y' in value) {
                set(data, property.path + '.0', value.x);
                set(data, property.path + '.1', value.y);
            } else if (Array.isArray(value)) {
                set(data, property.path + '.0', value[0]);
                set(data, property.path + '.1', value[1]);
            }
        } else {
            set(data, property.path, value);
        }
    }
}