# Self-Healing UI Test Automation System

## Overview

Self-Healing UI Test Automation System is a graduation thesis project that addresses one of the most common problems in UI test automation: brittle locators.

When web applications evolve, element locators such as IDs, CSS selectors, XPaths, placeholders, or test IDs often change. Traditional Selenium tests fail immediately when these changes occur, resulting in high maintenance costs.

This project introduces a self-healing framework capable of automatically recovering broken locators by analyzing multiple similarity dimensions and selecting the most probable replacement element.

The system continuously learns from historical healing events and updates locator scoring weights using an online Logistic Regression model.

---

## Key Features

### Multi-Dimensional Similarity Engine

The framework evaluates candidate elements using five similarity dimensions:

* Attribute Similarity
* Semantic Similarity
* Structural Similarity
* Visual Similarity
* Context Similarity

Each candidate receives a weighted score that determines its likelihood of being the correct replacement.

---

### Automatic Locator Recovery

When Selenium cannot locate an element:

1. The failure is intercepted.
2. Historical snapshots are loaded.
3. Candidate elements are discovered.
4. Similarity scores are calculated.
5. Candidates are ranked.
6. The best candidate is selected automatically.
7. The recovered locator is reused.

---

### Online Learning

The framework stores healing events in SQLite and continuously improves locator weighting using:

* Online Logistic Regression
* Historical healing outcomes
* Candidate ranking feedback

This allows the system to adapt to UI changes over time.

---

### Snapshot-Based Knowledge Base

The framework captures and stores:

* Element attributes
* Locator information
* Structural information
* Context information

Snapshots are used as historical references during healing.

---

### CI/CD Automation

GitHub Actions automatically:

* Builds the application
* Starts frontend and backend services
* Executes Selenium test suites
* Generates reports
* Preserves healing knowledge across executions

The pipeline runs on every push and pull request.

---

## System Architecture

Frontend

* React
* Vite

Backend

* Node.js
* Express
* MongoDB

Automation Framework

* Selenium WebDriver
* Pytest
* Python

Self-Healing Components

* HealingDriverV2
* Similarity Engine
* Candidate Ranker
* Snapshot Store
* Logistic Weight Model

Storage

* SQLite
* JSON Knowledge Base

CI/CD

* GitHub Actions

---

## UI Mutation Environment

To evaluate robustness, the project includes multiple UI versions.

Versions:

* v1 (Baseline)
* v2
* v3
* v4
* v5
* v6
* v7
* v8
* v9
* v10
* v11

Mutations include:

* Renamed IDs
* Modified data-testid attributes
* Removed attributes
* Placeholder changes
* Aria-label replacements
* Structural layout modifications
* Invalid XPath scenarios

These mutations intentionally break traditional Selenium locators and trigger the healing process.

---

## Test Coverage

The framework contains more than 40 automated test cases covering:

Authentication

* Login
* Registration

Product Management

* Product search
* Product filtering

Administration

* Admin workflows

Contact Features

* Contact form validation

Self-Healing Validation

* Broken ID recovery
* Broken data-testid recovery
* Placeholder recovery
* XPath recovery
* Structural change recovery

---

## Healing Workflow

```text
Selenium Locator Failure
            |
            v
Exception Interceptor
            |
            v
Load Snapshot
            |
            v
Find Candidate Elements
            |
            v
Calculate Similarity Scores
            |
            v
Rank Candidates
            |
            v
Auto-Heal Decision
            |
            v
Update Knowledge Base
            |
            v
Continue Test Execution
```

## Technologies

### Programming Languages

* Python
* JavaScript

### Test Automation

* Selenium WebDriver
* Pytest

### Machine Learning

* Scikit-learn
* Logistic Regression

### Frontend

* React
* Vite

### Backend

* Node.js
* Express
* MongoDB

### Database

* SQLite
* MongoDB

### DevOps

* GitHub Actions

---

## Results

Experimental evaluation was conducted on a custom-built web application containing multiple UI mutation versions.

Achievements:

* 40+ automated test scenarios
* 11 UI versions
* Automated CI/CD execution
* Successful recovery of locator failures caused by UI mutations
* Continuous learning through healing history

Note:
The reported results were obtained on a controlled experimental environment specifically designed for evaluating self-healing strategies.

---

## Repository Structure

```text
backend/
 ├── core/
 │   ├── Healing_driver_v2.py
 │   ├── Similarity_engine_v2.py
 │   ├── Logistic_weight_model.py
 │   └── Snapshot.py
 │
 ├── tests/
 │   ├── test_login.py
 │   ├── test_register.py
 │   ├── test_products.py
 │   ├── test_admin.py
 │   └── test_self_healing.py
 │
 ├── knowledge_base/
 │
 └── healing.db

myapp/
 ├── src/
 ├── src_mutated/
 └── public/

.github/
 └── workflows/
```

## Author

Tran Thi Ngoc Lan

Bachelor of Science in Artificial Intelligence

Thang Long University

Graduation Thesis Project
