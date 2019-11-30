import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject, combineLatest, EMPTY, from, merge, Subject, throwError, of, Observable } from 'rxjs';
import { catchError, filter, map, mergeMap, scan, shareReplay, tap, toArray, switchMap, concatMap } from 'rxjs/operators';

import { Product } from './product';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;



  constructor(private http: HttpClient,
              private productCategoryService: ProductCategoryService,
              private supplierService: SupplierService) { }

  // All products
  products$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      tap(data => console.log('Products', JSON.stringify(data))),
      catchError(this.handleError)
    );

  // Combine products with categories
  // Map to the revised shape.
  productsWithCategory$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$
  ]).pipe(
    map(([products, categories]) =>
      products.map(product => ({
        ...product,
        price: product.price * 1.5,
        category: categories.find(c => product.categoryId === c.id).name,
        searchKey: [product.productName]
      }) as Product)
    ),
    shareReplay(1)
  );

  // Action stream for product selection
  // Default to 0 for no product
  // Must have a default so the stream emits at least once.
  private productSelectedSubject = new BehaviorSubject<number>(0);
  productSelectedAction$ = this.productSelectedSubject.asObservable();

  // Currently selected product
  // Used in both List and Detail pages,
  // so use the shareReply to share it with any component that uses it
  selectedProduct$ = combineLatest([
    this.productsWithCategory$,
    this.productSelectedAction$
  ]).pipe(
    map(([products, selectedProductId]) =>
      products.find(product => product.id === selectedProductId)
    ),
    tap(product => console.log('selectedProduct', product)),
    shareReplay(1)
  );

  // Suppliers for the selected product
  // Finds suppliers from download of all suppliers
  // Add a catchError so that the display appears
  // even if the suppliers cannot be retrieved.
  // Note that it must return an empty array and not EMPTY
  // or the stream will complete.
  selectedProductSuppliers$ = combineLatest([
    this.selectedProduct$,
    this.supplierService.suppliers$
      .pipe(
        catchError(err => of([] as Supplier[]))
      )
  ]).pipe(
    map(([selectedProduct, suppliers]) =>
      suppliers.filter(
        supplier => selectedProduct ? selectedProduct.supplierIds.includes(supplier.id) : EMPTY
      )
    )
  );

  // Suppliers for the selected product
  // Only gets the suppliers it needs
  selectedProductSuppliers2$ = this.selectedProduct$
    .pipe(
      filter(selectedProduct => Boolean(selectedProduct)),
      switchMap(selectedProduct =>
        from(selectedProduct.supplierIds)
          .pipe(
            mergeMap(supplierId => this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)),
            toArray(),
            tap(suppliers => console.log('product suppliers', JSON.stringify(suppliers)))
          )
      )
    );

  /*
    Allows adding of products to the Observable
  */

  // Action Stream
  private productInsertedSubject = new Subject<Product>();
  productInsertedAction$ = this.productInsertedSubject.asObservable();

  // TODO: Action Stream for Added Product from Form
  private productModifiedSubject = new Subject<Product>();
  productModifiedAction$ = this.productModifiedSubject.asObservable();

  // Merge the streams
  productsWithAdd$ = merge(
    this.productsWithCategory$,
    this.productInsertedAction$
  )
    .pipe(
      tap(product => console.log('In merge', product)),
      scan((acc: Product[], value: Product) => [...acc, value]),
      catchError(err => {
        console.error(err);
        return throwError(err);
      })
    );

    // TODO: Save new product => Modify product list
  productsAfterPost$ = merge(
    this.productsWithCategory$,
    this.productModifiedAction$
      .pipe(
        tap(product => console.log('In merge', product)),
        concatMap(product => this.saveProduct(product))
      )
  ).pipe(
    // TODO: Use scan to combine products and new product
    scan((products: Product[], product: Product) => this.modifyProducts(products, product))
  );

  addProduct(newProduct?: Product) {
    // newProduct = newProduct || this.fakeProduct();
    newProduct = this.fakeProduct()
    console.log('in service', newProduct);
    // this.productInsertedSubject.next(newProduct);
    // console.log('in service', newProduct);
    this.productModifiedSubject.next(newProduct);
  }

  addFormProduct(formProduct?: Product) {
    formProduct = formProduct;
    console.log('in service', formProduct);
    this.productModifiedSubject.next(formProduct);

  }

  saveProduct(product: Product) {
    product.id = null;
    console.log('before save', product)
    const header = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Product>(this.productsUrl, product, { headers: header })
      .pipe(
        tap(data => console.log('Product saved to API', JSON.stringify(data))),
        catchError(this.handleError)
      );
  }

  // TODO: Convert products obj to products array
  modifyProducts(products: Product[], product: Product) {
    return [...products, {...product}];
  }

  // FIXME: Refactor
  // addActualProduct(newProduct?: Product): Observable<void | Product>{
  //   const data = newProduct;
  //   console.log('Before Res: ', data)
  //   const header = new HttpHeaders({'Content-Type': 'application/json'})
  //   return this.http.post<Product>(this.productsUrl, data, {headers: header})
  //   .pipe(
  //     tap(res => console.log('before', JSON.stringify(res))),
  //     map(
  //       res => this.productModifiedSubject.next(res)
  //     ),
  //     tap(res => console.log('after', JSON.stringify(res))),
  //     catchError(this.handleError)
  //   );
  // }

  // Change the selected product
  selectedProductChanged(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
  }

  private fakeProduct() {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      category: 'Toolbox',
      quantityInStock: 30
    };
  }

  private handleError(err: any) {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

}
