import React from "react";
import { useState } from "react";
import { NumberField } from "../src/ui/react-number-field";
import { mount } from "./react-boilerplate";
import { useInfiniteScroll } from "../src/ui/react-infinite-scroll";
import { range } from "../src/range";

mount(() => {
  const s = useInfiniteScroll<number>({
    getMore(i) {
      return Promise.resolve(range(10).map((e) => e + i * 10));
    },
    done(i, d) {
      return Promise.resolve(i >= 100);
    },
    dependencies: [],
    rootMargin: "50%",
  });

  return (
    <div>
      {s.items.map((i) => (
        <div key={i}>i am div {i}</div>
      ))}
      {<s.ScrollDetector></s.ScrollDetector>}
    </div>
  );
});
