import mongoose, { Schema, Model, Document } from "mongoose";

/**
 * TypeScript interface for Event document
 * Extends Document to include Mongoose document methods and properties
 */
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // ISO format date string
  time: string; // 24-hour format (HH:MM)
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Event Schema Definition
 * Includes validation rules and automatic timestamps
 */
const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true, // Index for faster queries
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    overview: {
      type: String,
      required: [true, "Overview is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    mode: {
      type: String,
      required: [true, "Mode is required"],
      enum: {
        values: ["online", "offline", "hybrid"],
        message: "Mode must be either online, offline, or hybrid",
      },
    },
    audience: {
      type: String,
      required: [true, "Audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required"],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: "Agenda must contain at least one item",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: "At least one tag is required",
      },
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

/**
 * Generates a URL-friendly slug from a string
 * Converts to lowercase, removes special characters, and replaces spaces with hyphens
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validates and normalizes date string to ISO format (YYYY-MM-DD)
 * Accepts formats: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY
 */
function normalizeDate(dateStr: string): string {
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format. Please provide a valid date.");
  }

  // Return ISO format date (YYYY-MM-DD)
  return date.toISOString().split("T")[0];
}

/**
 * Validates and normalizes time to 24-hour format (HH:MM)
 * Accepts formats: HH:MM, H:MM, HH:MM AM/PM
 */
function normalizeTime(timeStr: string): string {
  timeStr = timeStr.trim();

  // Handle 12-hour format (HH:MM AM/PM)
  const timeRegex12Hour = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match12Hour = timeStr.match(timeRegex12Hour);

  if (match12Hour) {
    let hours = parseInt(match12Hour[1], 10);
    const minutes = match12Hour[2];
    const period = match12Hour[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  // Handle 24-hour format (HH:MM)
  const timeRegex24Hour = /^(\d{1,2}):(\d{2})$/;
  const match24Hour = timeStr.match(timeRegex24Hour);

  if (match24Hour) {
    const hours = parseInt(match24Hour[1], 10);
    const minutes = parseInt(match24Hour[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error("Invalid time. Hours must be 0-23 and minutes 0-59.");
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  throw new Error("Invalid time format. Use HH:MM or HH:MM AM/PM.");
}

/**
 * Pre-save hook to handle slug generation and date/time normalization
 * Runs before every save operation (create or update)
 */
EventSchema.pre("save", function (next) {
  // Generate slug only if title is new or modified
  if (this.isModified("title")) {
    this.slug = generateSlug(this.title);
  }

  // Normalize date to ISO format if modified
  if (this.isModified("date")) {
    try {
      this.date = normalizeDate(this.date);
    } catch (error) {
      return next(error as Error);
    }
  }

  // Normalize time to 24-hour format if modified
  if (this.isModified("time")) {
    try {
      this.time = normalizeTime(this.time);
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

/**
 * Prevent model recompilation during development hot reloads
 * In production, the model is created once; in development, reuse existing model
 */
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
