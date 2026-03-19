import React from "react";
import { useState } from "react";
import { NumberField } from "../src/ui/react-number-field";
import { mount } from "./react-boilerplate";

mount(() => {
  const [value, setValue] = useState(10);

  return <NumberField value={value} setValue={setValue} step={1}></NumberField>;
});
