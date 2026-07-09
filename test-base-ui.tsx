import * as React from "react"
import { Menu } from "@base-ui/react/menu"
import { Slot } from "@radix-ui/react-slot"
import { renderToString } from "react-dom/server"

function DropdownMenuTrigger({ asChild, ...props }: any) {
  return <Menu.Trigger render={asChild ? <Slot /> : undefined} {...props} />
}

const html = renderToString(
  <Menu.Root>
    <DropdownMenuTrigger asChild>
      <button className="my-button">Click me</button>
    </DropdownMenuTrigger>
  </Menu.Root>
);
console.log(html);
