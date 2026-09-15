# Problem Statement

## Background

Retail stores live or die on the quality of advice they give customers. In a specialist building supplies
or home-furnishings store, experienced staff members carry years of product knowledge in their heads:
they know that mounting a 65-inch TV on a plasterboard wall requires cavity anchors, not standard rawl
plugs; they know that a 6-seat dining table cut from 8×4ft plywood needs exactly 2 sheets and 1 set of
4 legs; they know that a mid-range gaming PC build at £1,000 should pair a Ryzen 5 with an RTX 4060, not
an RTX 4070 that would be GPU-bottlenecked.

That knowledge is valuable, rare, and fragile. When an expert leaves, the knowledge leaves with them.

## The Problem

As foot traffic grows, a store faces two compounding challenges:

**1. Staffing throughput.** Five expert staff cannot simultaneously guide thirty customers. Wait times
increase. Customers give up or make uninformed purchases — often buying too little (making a second trip)
or too much (buying the wrong thing).

**2. Knowledge fragility.** Expert product knowledge is held in people, not systems. Staff turnover means
accumulated wisdom disappears overnight. New staff take months to reach the same recommendation quality.

## Who Is Affected

| Stakeholder | Pain |
|---|---|
| **Customers** | Wait for help, receive inconsistent advice, must visit multiple times because the first recommendation was incomplete |
| **Store owners** | Cannot scale expert guidance proportionally with customer volume; lose competitive edge when key staff leave |
| **New employees** | Long ramp-up time; no system to consult when unsure |

## Why Existing Solutions Fall Short

Generic e-commerce product filters ("filter by price / brand / category") do not solve this problem
because they require the customer to already know *what they need*. A customer who says "I want to build
a dining table" does not know they need plywood, hairpin legs, M8 bolts, PVA glue, 80-grit sandpaper,
220-grit sandpaper, and a satin varnish — in specific quantities based on table size.

Search bars and recommendation algorithms surface similar products — they do not reason about *relationships
between* products, quantity requirements, or project completeness. A store expert does all three.

The gap is not "better product data" — it is "expert reasoning over product data, available to every
customer, instantly."
