import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ProductService } from '../product.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Product } from '../product';

@Component({
  selector: 'pm-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit {
  productForm: FormGroup;
  product: Product;
  pageTitle = 'Product Add';
  errorMessage: string;
  data: any;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
    ) { }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      id: null,
      productName: ['', [Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)]],
      productCode: ['', [Validators.required]],
      price: '',
      description: '',
      categoryId: '',
      // [Validators.required, Validators.pattern('^[135]$')]

      quantityInStock: ''
    })
    console.log(this.productForm.value)
  }


  // ngAfterViewInit(): void {
  //   // Watch for the blur event from any input element on the form.
  //   // This is required because the valueChanges does not provide notification on blur
  //   const controlBlurs: Observable<any>[] = this.formInputElements
  //     .map((formControl: ElementRef) => fromEvent(formControl.nativeElement, 'blur'));

  //   // Merge the blur event observable with the valueChanges observable
  //   // so we only need to subscribe once.
  //   merge(this.productForm.valueChanges, ...controlBlurs).pipe(
  //     debounceTime(800)
  //   ).subscribe(value => {
  //     this.displayMessage = this.genericValidator.processMessages(this.productForm);
  //   });
  // }

  productAdd() {
    const p = this.productForm.value;
    console.log(p);
    this.productService.addFormProduct(p)
    // this.productService.addProduct(p)
  }

  // logProduct(productInput: FormGroup){
  //   console.log(productInput.value)
  // }

}
