/**
 * Converts numbers into English words (e.g. 75 -> "Seventy-Five", 266 -> "Two Hundred and Sixty-Six")
 * Used for DMC / OMR "In words" marks columns and totals.
 */

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertBelowThousand(n) {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) {
    const remainder = n % 10;
    return tens[Math.floor(n / 10)] + (remainder ? `-${ones[remainder]}` : "");
  }

  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  if (!remainder) return `${ones[hundred]} Hundred`;
  return `${ones[hundred]} Hundred and ${convertBelowThousand(remainder)}`;
}

export function numberToWords(num) {
  if (num === null || num === undefined || num === "" || num === "-") {
    return "-";
  }

  const s = String(num).trim().toUpperCase();
  if (s === "NA") return "NA";

  const n = Number(num);
  if (isNaN(n)) return String(num);
  if (n === 0) return "Zero";

  const isNegative = n < 0;
  const absNum = Math.abs(n);
  const intPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - intPart) * 100);

  let words = "";

  if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    const remainder = intPart % 1000000;
    words += `${convertBelowThousand(millions)} Million`;
    if (remainder > 0) words += ` ${convertBelowThousand(remainder)}`;
  } else if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    const remainder = intPart % 1000;
    words += `${convertBelowThousand(thousands)} Thousand`;
    if (remainder > 0) {
      if (remainder < 100) {
        words += ` and ${convertBelowThousand(remainder)}`;
      } else {
        words += ` ${convertBelowThousand(remainder)}`;
      }
    }
  } else {
    words = convertBelowThousand(intPart);
  }

  if (decimalPart > 0) {
    words += ` point ${convertBelowThousand(decimalPart)}`;
  }

  return (isNegative ? "Minus " : "") + (words.trim() || "Zero");
}

export default numberToWords;
