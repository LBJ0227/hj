
var Cart = {
	maxQuantity: 200,
	cartPull: function () {
		if (userPersistenceId) {
			var cartGetXhr = $.ajax({
				url: '/api/vtl/cart/',
				method: 'GET'
			});

			cartGetXhr.done(function (data) {
				if (typeof data === "object") {
					if (data.success) {
						if (data.hasOwnProperty('data')) {
							Cart.hasCart = data.hasCart;
							Vue.set(Cart.vue, 'cart', data.data);
						}
					}
				}
			});
		}
	},
	cartPush: function (vm) {
		vm.loading = true;
		var outData = {
			action: 'update',
			data: vm.cart
		};
		var cartPushXhr = $.ajax({
			url: "/api/vtl/cart/",
			method: "POST",
			contentType: "application/json",
			data: JSON.stringify(outData)
		});
		cartPushXhr.done(function (data) {
			if (data.success && data.data) {
				Vue.set(Cart.vue, 'cart', data.data);
				
				Cart.hasCart = data.hasCart;
				Vue.set(Cart.vue, 'hasCart', data.hasCart);
				
				if (data.hasCart) {
					vm.updateTotals();
				}
			}
		});
		cartPushXhr.always(function (data, status, err) {

			window.setTimeout(Vue.set(Cart.vue, "loading", false), 2500);

			if (typeof vm.modals.cart !== 'undefined') {
				vm.modals.confirmation = true;
			}
			if (typeof vm.disableChanges !== 'undefined') {
				vm.disableChanges = false;
			}
			vm.confirmationMessage = data;
		});
	},
	addToCart: function (vm) {
		if (!vm.hasError) {
			var variantIdentifier = null;
			if (vm.selectedProduct.productType === 'variants' && vm.selectedProduct.variants.length) {
				vm.selectedProduct.variants.forEach(function (element) {
					if (vm.productUserSelection.sku === element.sku) {
						variantIdentifier = element.identifier;
					}
				});
			}
			if (vm.hasCart) {
				var matchingItem = false;
				vm.cart.forEach(function (element) {
					if (element.sku === vm.productUserSelection.sku) {
						matchingItem = true;
						element.quantity = vm.productUserSelection.quantity;
					}
				});
				if (matchingItem === false) {
					vm.cart.push({
						sku: vm.productUserSelection.sku,
						baseSku: vm.selectedProduct.sku,
						productType: vm.selectedProduct.productType,
						quantity: vm.productUserSelection.quantity,
						variantIdentifier: variantIdentifier
					});
					Cart.hasCart = true;
				}
			} else {
				if (!vm.cart) vm.cart = [];
				vm.cart.push({
					sku: vm.productUserSelection.sku,
					baseSku: vm.selectedProduct.sku,
					productType: vm.selectedProduct.productType,
					quantity: vm.productUserSelection.quantity,
					variantIdentifier: variantIdentifier
				});
				Cart.hasCart = true;
			}
			Cart.cartPush(vm);
			Cart.vue.updateTotals();
		}
	},
	init: function () {
		Cart.cartPull();
		document.querySelectorAll("a[data-cart-link]").forEach(function (element, index) {
			element.addEventListener("click", function (event) {
				Vue.set(Cart.vue.modals, "cart", true);
			});
		});
	},
	vueMixins: {
		methods: {
			addToCart: function () {
				var validFields = true;
				if (!this.productUserSelection.sku) {
					validFields = false;
					this.showErrorMessage = true;
					this.errorMessageType = "sku";
				}
				if (!this.productUserSelection.quantity || typeof this.productUserSelection.quantity !== "number") {
					validFields = false;
					this.showErrorMessage = true;
					this.errorMessageType = "quantity";
				}
				if (typeof this.productUserSelection.quantity === "number" && this.productUserSelection.quantity > this.getMaxQuantity(this.selectedProduct, this.productUserSelection.sku)) {
					validFields = false;
					this.showErrorMessage = true;
					this.errorMessageType = "quantity-max";
				}
				console.log(validFields);
				if (validFields === false) {
					this.hasError = true;
				} else {
					this.hasError = false;
					Cart.addToCart(this);
				}
			}
		}
	}
};

Cart.vue = new Vue({
	el: "#lbj-store",
	mixins: [Cart.vueMixins],
	data: function () {
		return {
			products: null,
			seriesProducts: null,
			productSeriesDisplayMode: false,
			selectedProduct: null,
			selectedProductActiveMedia: null,
			productSeriesIdentifiers: null,
			confirmationMessage: null,
			disableChanges: false,
			modals: {
				cart: false,
				checkout: false,
				confirmation: false,
				productDetail: false
			},
			productUserSelection: {
				sku: null,
				quantity: null
			},
			loading: false,
			showErrorMessage: false,
			errorMessageType: null,
			maxQuantity: Cart.maxQuantity,
			cart: null,
			hasCart: false,
			shippingUnitPrice: 395,
			shippingFee: 0,
			subtotal: 0,
			grandTotal: 0,
			checkoutText: 'Checkout',
			checkoutOptions: { 'userName': 'lrmrventures', 'formHash': 'z1tkmmn91fugp47', 'autoResize': true, 'height': '927', 'async': true, 'host': 'wufoo.com', 'header': 'show', 'ssl': true }
		}
	},
	methods: {
		getProducts: function () {
			var vm = this;
			var productsXhr = $.ajax({
				url: '/api/vtl/products',
				method: 'GET'
			});
			productsXhr.done(function (data) {
				if (typeof data === 'object' && data.success && data.data) {
					vm.products = data.data
				}
			});
		},
		getProductSeries: function () {
			var vm = this;
			var url = '/api/vtl/product-series';

			this.productSeriesIdentifiers.forEach(function (element) {
				url = url + "/series/" + element;
			});
			var productSeriesXhr = $.ajax({
				url: url,
				method: 'GET'
			});
			productSeriesXhr.done(function (data) {
				if (typeof data === 'object' && data.success && data.data) {
					vm.seriesProducts = data.data
				}
			});
		},
		getSeriesIdentifiersFromWidget: function (data) {
			this.productSeriesIdentifiers = data;
		},
		getSelectedVariant: function () {
			var vm = this;
			var selectedVariant = null;
			if (this.selectedProduct && this.selectedProduct.productType === "variants") {
				this.selectedProduct.variants.forEach(function (element) {
					if (element.sku === vm.productUserSelection.sku) {
						selectedVariant = element;
					}
				});
			}
			return selectedVariant;
		},
		getVariant: function (product, sku) {
			var variant = null;
			if (product.hasVariants === true) {
				product.variants.forEach(function (element) {
					if (element.sku === sku) {
						variant = element;
					}
				});
			}
			return variant;
		},
		getMaxQuantity: function (product, sku) {
			var maxQuantity = this.maxQuantity;
			if (product.hasVariants === true) {
				var variant = this.getVariant(product, sku);
				if (variant !== null && variant.availability === "available-limited") {
					maxQuantity = variant.maxQuantity;
				}
			}
			return maxQuantity;
		},
		showMediaItem: function (mediaItemIndex) {
			if (this.selectedProductMedia) {
				this.selectedProductActiveMedia = this.selectedProductMedia[mediaItemIndex];
			}
		},
		showProductDetail: function (product) {
			var vm = this;
			this.selectedProduct = null;
			if (this.modals.cart === false) {
				this.selectedProduct = product;
				this.showMediaItem(0);
				this.modals.productDetail = true;
			} else if (this.modals.cart === true) { // Find matching product from product list in cart view
				this.modals.cart = false;
				this.products.forEach(function (element) {
					if (element.sku === product.baseSku) {
						vm.selectedProduct = element;
						this.showMediaItem(0);
					}
				});
			}
			if (this.selectedProduct !== null) {
				this.modals.productDetail = true;
				this.productUserSelection.quantity = 1;
			}
		},
		closeProductDetail: function () {
			this.selectedProduct = null;
			this.productUserSelection.sku = null;
			this.quantity = null;
		},
		closeConfirmationMessage: function () {
			this.modals.confirmation = false;
		},
		showCartDetail: function () {
			this.modals.cart = true;
			if (this.modals.confirmation === true) {
				this.closeConfirmationMessage();
			}
		},
		closeCartDetail: function () {
			this.modals.cart = false;
		},
		showCheckout: function () {
			this.modals.checkout = true;
			if (this.modals.confirmation === true) {
				this.closeConfirmationMessage();
			}
		},
		closeCheckout: function () {
			this.loading = true;
			this.modals.checkout = false;
			var vm = this;
			window.setTimeout(function () {
				vm.getCart();
			}, 1500, vm);
			this.checkoutText = "Checkout";
		},
		productName: function (item) {
			if (item.hasVariant === true) {
				return item.productName + ' (' + item.variantName + ')';
			} else {
				return item.productName;
			}
		},
		integerToCurrency: function (amount) {
			if (typeof amount === "number") {
				return "$" + (amount / 100).toFixed(2);
			}
		},
		getCart: function () {
			var vm = this;
			this.loading = true;
			var cartGetXhr = $.ajax({
				url: '/api/vtl/cart/',
				method: 'GET'
			});
			cartGetXhr.done(function (data) {
				if (typeof data === "object") {
					if (data.success) {
						if (data.hasOwnProperty('data')) {
							vm.cart = data.data;
							vm.hasCart = data.hasCart;
							if (vm.hasCart && vm.cart.length) {
								vm.updateTotals();
								Vue.set(Cart.vue, 'cart', data.data);
							}
						}
					}
				}
			});
			cartGetXhr.always(function () {
				vm.loading = false;
				window.setTimeout(function () {
					vm.loading = false;
					hideLoading();
				}, 1000);
			});
		},
		checkQuantities: function () {
			var vm = this;
			vm.cart.forEach(function (element, index) {
				if (element.quantity > Cart.maxQuantity) {
					vm.cart[index].quantity = Cart.maxQuantity;
				}
			});
		},
		updateQuantity: function () {
			this.disableChanges = true;
			this.loading = true;
			this.checkQuantities();
			var vm = this;
			var outData = {
				action: 'update',
				data: this.cart
			};
			console.log(outData);
			var cartPushXhr = $.ajax({
				url: "/api/vtl/cart",
				method: "POST",
				contentType: "application/json",
				data: JSON.stringify(outData)
			});
			cartPushXhr.done(function (data) {
				if (data.success && data.data) {

				}
			});
			cartPushXhr.always(function (data, status, err) {
				window.setTimeout(function () {
					Cart.cartPull();
					vm.getCart();
				}, 1750);
				vm.disableChanges = false;
				vm.message = data;
			});
		},
		removeProductFromCart: function (item) {
			this.disableChanges = true;
			this.loading = true;
			var vm = this;
			var outData = {
				action: 'remove',
				data: item.identifier
			};
			var cartDelXhr = $.ajax({
				url: "/api/vtl/cart",
				method: "DELETE",
				contentType: "application/json",
				data: JSON.stringify(outData)
			});
			cartDelXhr.done(function (data) {
				if (data.success && data.data) {

				}
			});
			cartDelXhr.always(function (data, status, err) {
				window.setTimeout(function () {
					Cart.cartPull();
					vm.getCart();
				}, 1750);
				vm.disableChanges = false;
				vm.message = data;
			});
		},
		emptyCart: function () {
			this.loading = true;
			var vm = this;
			var cartEmptyXhr = $.ajax({
				url: '/api/vtl/cart-empty/',
				method: 'POST'
			});
			cartEmptyXhr.done(function (data) {
				if (typeof data === "object" && data.success) {
					vm.hasCart = data.hasCart;
					vm.cart = data.data;
				}
			});
			cartEmptyXhr.always(function () {
				setTimeout(function () {
					vm.loading = false;
				}, 1000, vm);
			});
		},
		getShippingFee: function () {
			var vm = this;
			var cartShippingFeeXhr = $.ajax({
				method: "GET",
				url: '/api/vtl/shipping'
			});
			cartShippingFeeXhr.done(function (data) {
				if (typeof data === "object") {
					if (data.success && data.shippingUnitPrice > -1) {
						vm.shippingUnitPrice = data.shippingUnitPrice;
						vm.updateShippingFee();
					}
				}
			});
			cartShippingFeeXhr.always(function () {

			});
		},
		updateTotals: function () {
			this.shippingFee = this.updateShippingFee();
			this.subtotal = this.updateSubtotal();
			this.grandTotal = this.updateGrandTotal();
		},
		updateSubtotal: function () {
			var outPrice = 0;
			this.cart.forEach(function (element) {
				outPrice = outPrice + element.price;
			});
			this.subtotal = outPrice;
			return outPrice;
		},
		updateShippingFee: function () {
			var outPrice = this.shippingUnitPrice;
			this.shippingFee = outPrice;
			return outPrice;
		},
		updateGrandTotal: function () {
			var outPrice = 0;
			var subtotal = this.updateSubtotal();
			var shippingFee = this.updateShippingFee();
			outPrice = subtotal + shippingFee;
			this.grandTotal = outPrice;
			return outPrice;
		},
		getWufooCartContentsString: function () {
			var out = String("");
			out += "lebronjames.com Order" + "%0A";
			out += "========================================" + "%0A";
			this.cart.forEach(function (item) {
				out += "Product" + "%0A";
				out += "- Name:" + item.productName + "%0A";
				out += "- SKU: " + item.sku + "%0A";
				out += "- Quantity: " + item.quantity + "%0A";
				out += "- Price: $" + ((item.price / 100).toFixed(2)) + "%0A";
				out += "----------" + "%0A"
			});
			out += "%0A";
			out += "Subtotal: " + this.integerToCurrency(this.updateSubtotal()) + "%0A";
			out += "Shipping: " + this.integerToCurrency(this.updateShippingFee()) + "%0A";
			out += "Grand Total: " + this.integerToCurrency(this.updateGrandTotal()) + "%0A";

			out += "========================================" + "%0A";

			return out;
		},
		getWufooOrderDetailString: function () {
			return this.getWufooCartContentsString();
		},
		getCheckoutFieldValues: function () {
			var out = '';
			out += 'Field22=' + encodeURIComponent(this.integerToCurrency(this.updateSubtotal()));
			out += '&Field24=' + encodeURIComponent(this.integerToCurrency(this.updateShippingFee()));
			out += '&Field18=' + encodeURI((this.updateGrandTotal() / 100).toFixed(2));
			out += '&Field25=' + encodeURIComponent(this.integerToCurrency(this.updateGrandTotal()));
			out += '&Field27=' + encodeURIComponent('{"data":' + JSON.stringify(this.cart) + '}');
			out += '&Field17=' + encodeURIComponent(this.getWufooCartContentsString());
			return out;
		}
	},
	watch: {
		'modals.checkout': function () {
			if (this.modals.checkout === true) {
				if (typeof z1tkmmn91fugp47 === 'undefined') {
					this.checkoutOptions.defaultValues = this.getCheckoutFieldValues();
					z1tkmmn91fugp47 = new WufooForm();
					z1tkmmn91fugp47.initialize(this.checkoutOptions);
					z1tkmmn91fugp47.display();
				}
			} else if (this.modals.checkout === false) {
				z1tkmmn91fugp47 = undefined;
			}
		},
		'productUserSelection.quantity': function (newVal) {
			if (this.selectedProduct !== null) {
				if (this.showErrorMessage === true && this.errorMessageType.indexOf('quantity') > -1) {
					if (newVal && newVal <= this.maxQuantity) {
						this.showErrorMessage = "";
					}
				}
			}
		},
		'productUserSelection.sku': function (newVal) {
			if (this.selectedProduct !== null) {
				if (this.showErrorMessage === true && this.errorMessageType === 'sku') {
					if (newVal) {
						this.showErrorMessage = "";
					}
				}
			}
		}
	},
	computed: {
		selectedProductMedia: function () {
			if (this.selectedProduct) {
				return this.selectedProduct.media
			}
		},
		quantityText: function () {
			if (this.selectedProduct && this.selectedProduct.media.length) {
				if (this.selectedProduct.hasVariants) {
					var variant = this.getSelectedVariant();
					if (variant !== null && variant.availability === "available-limited") {
						return 'Quantity <span style="font-size:0.9rem;">(Max ' + variant.maxQuantity + ')';
					}
				} else {
					return 'Quantity <span style="font-size:0.9rem;">(Max ' + this.maxQuantity + ')';
				}
			}
			return "";
		},
		subtotalText: function () {
			return this.integerToCurrency(this.updateSubtotal());
		},
		shippingText: function () {
			return this.integerToCurrency(this.shippingFee);
		},
		grandTotalText: function () {
			return this.integerToCurrency(this.updateGrandTotal());
		}
	},
	created: function () {
		this.getProducts();
	},
	mounted: function () {
		if (this.productSeriesIdentifiers) {
			this.productSeriesDisplayMode = true;
			this.getProductSeries();
			this.getCart();
			this.getShippingFee();
		}
	}
});


document.addEventListener("DOMContentLoaded", function () {
	Cart.init();
})
