import "@testing-library/jest-dom";

// jsdom ships no layout engine, so scrollIntoView is simply absent
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
