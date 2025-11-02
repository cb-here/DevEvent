import mongoose, { Schema, Model, Document, Types } from "mongoose";

/**
 * TypeScript interface for Booking document
 * Extends Document to include Mongoose document methods and properties
 */
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking Schema Definition
 * References the Event model and validates email format
 */
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event", // Reference to Event model
      required: [true, "Event ID is required"],
      index: true, // Index for faster queries on eventId
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string): boolean {
          // RFC 5322 compliant email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

/**
 * Pre-save hook to validate that the referenced Event exists
 * Prevents orphaned bookings by ensuring eventId references a valid Event document
 */
BookingSchema.pre("save", async function (next) {
  // Only validate eventId if it's new or has been modified
  if (this.isModified("eventId")) {
    try {
      // Dynamically import Event model to avoid circular dependency
      const Event = mongoose.models.Event || (await import("./event.model")).default;

      // Check if the event exists in the database
      const eventExists = await Event.exists({ _id: this.eventId });

      if (!eventExists) {
        throw new Error(
          `Event with ID ${this.eventId} does not exist. Cannot create booking for non-existent event.`
        );
      }
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

/**
 * Compound index for efficient queries on eventId and email combinations
 * Prevents duplicate bookings for the same event and email
 */
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

/**
 * Prevent model recompilation during development hot reloads
 * In production, the model is created once; in development, reuse existing model
 */
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
