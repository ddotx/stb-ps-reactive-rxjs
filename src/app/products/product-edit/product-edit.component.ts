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
    private productService: ProductService,
    private router: Router,
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
    });
    console.error('Init Form', this.productForm.value);
  }

  // TODO: === Form Product
  productAdd() {
    const p = this.productForm.value;
    console.error('Submitted Product', p);
    this.productService.addProduct(p);
    this.router.navigate(['products/allproducts']);
  }

}
