const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: status ? status : "pending",
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  let message;
  if (!deliverTo || deliverTo === "")
    message = "Order must include a deliverTo";
  else if (!mobileNumber || mobileNumber === "")
    message = "Order must include a mobileNumber";
  else if (!dishes) message = "Order must include a dish";
  else if (!Array.isArray(dishes) || dishes.length === 0)
    message = "Order must include at least one dish";
  else {
    for (let i = 0; i < dishes.length; i++) {
      if (
        !dishes[i].quantity ||
        dishes[i].quantity <= 0 ||
        !Number.isInteger(dishes[i].quantity)
      )
        message = `Dish ${i} must have a quantity that is an integer greater than 0`;
    }
  }

  if (message) {
    return next({
      status: 400,
      message: message,
    });
  }

  next();
}

function read(req, res) {
  res.json({
    data: res.locals.order,
  });
}

function orderExists(req, res, next) {
	const { orderId } = req.params;
	const foundOrder = orders.find((order) => order.id === orderId);

	if(foundOrder) {
		res.locals.order = foundOrder;
		return next();
	}

	next({
		status: 404,
		message: `Order id does not exist: ${orderId}`,
	});
}



function update(req, res, next) {
  const {orderId} = req.params;
  const originalOrder = res.locals.order;
const { data: { id, deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  if(id && id !== orderId)
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  if (!status || status == "")
    return next({status: 400, message: 'Order must include a status'});
  if (status === "invalid")
    return next({status: 400, message: 'Order status must be valid'});
  if (status === "delivered")
    return next({
      status: 400,
      message: 'A delivered order cannot be changed',
    });

res.locals.order = {
  id: originalOrder.id,
  deliverTo: deliverTo,
  mobileNumber: mobileNumber,
  dishes: dishes,
  status: status,
}

res.json({ data: res.locals.order });
}

function validateDestroy(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next()
}

function destroy(req, res) {
  const i = orders.indexOf(res.locals.order);
  orders.splice(i, 1);
  res.sendStatus(204);
}


module.exports = {
  list,
  read: [orderExists, read],
  create: [validateOrder, create],
  update: [orderExists, validateOrder, update],
  destroy: [orderExists, validateDestroy, destroy],
};
