"use client";

import EventCard from "./components/EventCard";
import ExploreBtn from "./components/ExploreButton";
import { events } from "@/lib/constants";

export default function Home() {
  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Cann&apos;t Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups and Confernces, All in One page
      </p>
      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h1>Featured Events</h1>
        <ul className="events">
          {events.map((event: any) => (
            <li key={event.title}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
