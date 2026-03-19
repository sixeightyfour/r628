import { useState } from "react";
import { NumberField } from "../src/ui/react-number-field";
import {
  ObjectField,
  objectFieldDataToNativeObject,
  ObjectFieldLayout,
  useObjectFieldLayout,
} from "../src/ui/react-object-field";
import { StringField } from "../src/ui/react-string-field";
import { mount } from "./react-boilerplate";

const COMPONENTS = {
  num: NumberField,
  str: StringField,
};

mount(() => {
  const [value, setValue] = useObjectFieldLayout<typeof COMPONENTS>()({
    numtest: {
      ui: "num",
      props: {},
      value: 3,
      label: "NUMBER FIELD TEST",
    },
    strtest: {
      ui: "str",
      props: {},
      value: "string",
      label: "string FIELD TEST",
    },
  });

  return (
    <>
      <ObjectField
        components={COMPONENTS}
        value={value}
        setValue={setValue}
      ></ObjectField>
      JSON Preview
      <div>{JSON.stringify(objectFieldDataToNativeObject(value), null, 2)}</div>
    </>
  );
});
