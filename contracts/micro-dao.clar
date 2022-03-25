
;; micro-dao
;;
;; Small contract to manage a simple DAO structure for small teams

;; constants
;;

;; 5 days before an action could be executed if no dissent was put up
(define-constant DISSENT-EXPIRY (* 144 5))

;; membership errors codes start with 1
(define-constant MEMBER-EXISTS 1001)
(define-constant MEMBER-NOT-FOUND 1002)

;; initial members of dao
(define-constant INITIAL-MEMBERS 
    (list 
        {address: contract-caller}
        {address: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5}
        {address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG}))

;; data maps and vars
;;

;; members of the DAO who could create funding proposals and manage their balances

(define-map members uint {address: principal})
(define-map id-by-address principal uint)


(define-data-var members-count uint u0)

;; Funding proposals where we store funding proposals

;; vouch proposals

;; private functions
;;

(define-private (add-member (data {address: principal})) 
    (let
        (
            (current-index (var-get members-count))
        )
        (if (map-insert members current-index data) 
            (begin 
                (map-insert id-by-address (get address data) current-index)
                (ok (var-set members-count (+ u1 current-index))))
            (err MEMBER-EXISTS))))

;; public functions
;;

;; get member data

(define-read-only (get-member-data (id uint)) 
    (ok (unwrap! (map-get? members id) (err MEMBER-NOT-FOUND))))



(define-read-only (get-member-id (member-address principal)) 
    (ok (unwrap! (map-get? id-by-address member-address) (err MEMBER-NOT-FOUND))))

;; get balance


(define-read-only (get-balance) 
    (ok (stx-get-balance (as-contract tx-sender))))

;; propose to add new member

;; propose a new funding proposal

;; vote to support funding proposal

;; vote to support adding a new member

;; exit dao


;; INIT
;;


(map add-member INITIAL-MEMBERS)