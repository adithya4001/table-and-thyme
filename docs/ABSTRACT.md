# AI-Enhanced Restaurant Order & Billing System

**Project name:** Table & Thyme  
**Student:** Vuppu Adithya Kumar  
**Institution:** Anurag University  
**Course:** Technical Training · Semester 5 · 3 credits

## Abstract

Restaurant operations require accurate order capture, clear kitchen communication and reliable billing. Manual workflows can create calculation errors, duplicate records, inventory discrepancies and limited visibility into sales. Table & Thyme is a full-stack restaurant order and billing application designed to manage the dining lifecycle from menu selection to a recorded payment and digital receipt.

The system uses React for an interactive staff interface, Java with Spring Boot for RESTful business services, and MySQL for persistent relational data. Staff can browse and search menu categories, assemble a cart, select a table or takeaway, and submit an order. The backend validates quantities and availability, reserves stock, stores historical item prices and updates table occupancy within a transaction. Kitchen tickets progress through received, preparing and served stages. A separate billing process applies a discount and a demonstration tax, generates a receipt, records a payment method and releases the table. Sales analytics report paid revenue, popular dishes and low-stock items.

An optional Gemini API integration provides menu pairing suggestions and converts typed order requests into proposed cart items. Requests pass through the backend so the API key is not exposed in the browser. Suggestions require staff review before an order is submitted. When Gemini is unavailable, explicitly labelled local rules retain a usable demonstration workflow without claiming to be an AI model.

Expected outputs include persisted order summaries, automatically calculated bills, printable digital receipts, updated portion stock and paid-sales records. The project demonstrates component-based frontend development, Java API design, request validation, transactional consistency, relational data modelling and external API integration in a practical hospitality use case.

## Technologies

React 19, the local frontend server, Java 17+, Spring Boot 3.5, Spring MVC, Bean Validation, Spring Data JPA/Hibernate, MySQL 8, Maven, optional Gemini REST API, CSS, browser printing. Automated integration tests use H2 solely as an isolated test database.

## Procedure

1. Initialize MySQL schema and starter menu/table data.
2. Request the menu through the React → Spring Boot → MySQL flow.
3. Assemble and optionally enrich the cart using reviewed assistant suggestions.
4. Submit an order; validate stock and save order lines transactionally.
5. Track the order through kitchen preparation and service.
6. Generate a bill from saved order prices; record payment separately.
7. Print the receipt and inspect persisted paid-sales analytics.

## Applications and scope

The prototype supports dine-in restaurants, cafés and takeaway counters. It is designed for a local academic demonstration by restaurant staff. It does not process bank payments or implement authentication, legally compliant tax invoicing, ingredient recipes or multi-branch operation. Its stock model tracks ready-to-serve portions. Future extensions include staff roles, kitchen WebSockets, ingredient-level inventory, real payment gateways and configurable tax policies.

## Workflow

See `workflow.svg` for a reusable diagram, `architecture.mmd` for the editable architecture, and `order-lifecycle.mmd` for the order state diagram.
